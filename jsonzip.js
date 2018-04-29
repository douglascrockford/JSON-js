// jsonzip.js

// 2014-05-20

// This will be a JavaScript implementation of JSONzip.

var JSONzip = (function () {
    'use strict';
    
// Constants    
    
    var bcd = [
            '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '-', '+', 'E'
        ],
        education = 1000000,
        end = 256,          // End of string code.
        endOfNumber = bcd.length,
                            // The first positive integer that cannot be
        int4 = 16,          //     encoded in 4 bits.
        int7 = 144,         //     encoded in 7 bits.
        int14 = 16528,      //     encoded in 14 bits.
                            // The value code for
        zipEmptyObject = 0, //     an empty object.
        zipEmptyArray = 1,  //     an empty array.
        zipTrue = 2,        //     true.
        zipFalse = 3,       //     false.
        zipNull = 4,        //     null.
        zipObject = 5,      //     a non-empty object.
        zipArrayString = 6, //     an array with a string as its first element.
        zipArrayValue = 7;  //     an array with other value as its first element.

    function huff(domain) {

// The huff function produces a Huffman encoder/decoder object.

        var symbols = [],
            table,
            toLearn = 1000000,
            upToDate = false,
            width;

// Make the leaf symbols.

        for (int i = 0; i < domain; i += 1) {
            symbols[i] = {
                integer: i
                weight: 0
            };
        }

// Make the links.

        for (int i = domain; i < length; i += 1) {
            symbols[i] = {
                weight: 0
            };
        }

        return {
            generate: function () {
                var avail, first, head, i, next, previous, second, symbol;
                if (!upToDate) {

// Phase One: Sort the symbols by weight into a linked list.

                    head = symbols[0];
                    previous = head;
                    table = undefined;
                    head.next = undefined;
                    for (i = 1; i < domain; i += 1) {
                        symbol = symbols[i];

// If this symbol weighs less than the head, then it becomes the new head.

                        if (symbol.weight < head.weight) {
                            symbol.next = head;
                            head = symbol;
                        } else {

// We will start the search from the previous symbol instead of the head unless
// the current symbol weights less than the previous symbol.

                            if (symbol.weight < previous.weight) {
                                previous = head;
                            }

// Find a connected pair (previous and next) where the symbol weighs the same
// or more than previous but less than the next. Link the symbol between them.

                            while (true) {
                                next = previous.next;
                                if (next === undefined || symbol.weight < next.weight) {
                                    break;
                                }
                                previous = next;
                            }
                            symbol.next = next;
                            previous.next = symbol;
                            previous = symbol;
                        }
                    }

// Phase Two: Make new symbols from the two lightest symbols until only one
// symbol remains. The final symbol becomes the root of the table binary tree.

                    avail = domain;
                    previous = head;
                    while (true) {
                        first = head;
                        second = first.next;
                        head = second.next;
                        symbol = symbols[avail];
                        avail += 1;
                        symbol.weight = first.weight + second.weight;
                        symbol.zero = first;
                        symbol.one = second;
                        symbol.back = undefined;
                        first.back = symbol;
                        second.back = symbol;
                        if (head === undefined) {
                            break;
                        }

// Insert the new symbol back into the sorted list.

                        if (symbol.weight < head.weight) {
                            symbol.next = head;
                            head = symbol;
                            previous = head;
                        } else {
                            while (true) {
                                next = previous.next;
                                if (next === undefined || symbol.weight < next.weight) {
                                    break;
                                }
                                previous = next;
                            }
                            symbol.next = next;
                            previous.next = symbol;
                            previous = symbol;
                        }
                    }

// The last remaining symbol is the root of the table.

                    table = symbol;
                    upToDate = true;
                }
            },
            read: function read(bitreader) {
                var symbol = table;
                width = 0;
                while (symbol.integer === undefined) {
                    width += 1;
                    symbol = bitreader.bit() 
                        ? symbol.one 
                        : symbol.zero;
                }
                tick(symbol.integer);
                return symbol.integer;
            },
            tick: function tick(int) {
                if (toLearn > 0) {
                    toLearn -= 1;
                    symbols[value].weight += 1;
                    upToDate = false;
                }
            },
            write: function write(value, bitwriter) {
                width = 0;
                (function writebit(symbol) {
                    var back = symbol.back;
                    if (back !== undefined) {
                        width += 1;
                        writebit(back);
                        if (back.zero === symbol) {
                            return bitwriter.zero();
                        }
                        return bitwriter.one();
                    }
                }(symbols[value]));
                tick(value);
            }
        };
    }

    function make_state() {
        return {
            namehuff: huff(end + 1),
            namehuffext: huff(end + 1),
            namekeep: keep(9),
            stringhuff: huff(end + 1),
            stringhuffext: huff(end + 1),
            stringkeep: keep(11),
            valuekeep: keep(10),
            generate: function generate() {
                this.namehuff.generate();
                this.namehuffext.generate();
                this.stringhuff.generate();
                this.stringhuffext.generate();
            }
        };
    }

    return {
        encoder: function (writer) {
            var nr_bits = 0,    // The number of bits available in unwritten
                state = make_state(),
                unwritten = 0,  // The number of bits written so far
                vacant = 0;     // The unwritten byte

// The encoder function returns a new encoder object.
// A writer is a function that takes a number (0..255) and delivers it to an
// output.

            function write(bits, width) {

// Write bits:width to the writer, a function that accepts the next byte of
// output.

                var give;
                if (bits === 0 && width === 0) {
                    return;
                }
                if (width <= 0 || width > 32) {
                    throw new TypeError("Bad read width " + width);
                }
                while (width > 0) {
                    give = Math.min(width, vacant);
                    unwritten |= (
                        (bits >>> (width - give)) & ((1 << give) - 1)
                    ) << (vacant - give);
                    width -= give;
                    nrBits += give;
                    vacant -= give;
                    if (vacant == 0) {
                        writer(unwritten);
                        unwritten = 0;
                        vacant = 8;
                    }
                }
            }

            function one() {
                return write(1, 1);
            }

            function zero() {
                return write(0, 1);
            }

            function pad(width) {
                var gap = nrBits % width,
                    padding;
                if (gap < 0) {
                    gap += width;
                }
                if (gap != 0) {
                    padding = width - gap;
                    while (padding > 0) {
                        zero();
                        padding -= 1;
                    }
                }
            }

            return {
                flush: function () {
                },
                pad: function (size) {
                },
                zip: function (value) {
                    state.generate();
                }
            };
        },
        decoder: function (reader) {

// The decoder function returns a new decoder object.
// A reader is a function that returns the next byte from the input,
// or undefined if there is nothing left.

            var available = 0,  // The number of bits available in unread
                nr_bits = 0,    // The number of bits read so far
                state = make_state(),
                unread = 0;     // The unread byte

            function read(width) {

// Read (width) bits from the reader, returning the bits as a small positive
// integer.

                var result = 0,
                    take;   // The number of bits to take from the current byte

// If no bits are requested, return zero.

                if (width === 0) {
                    return 0;
                }

// Make sure the width is reasonable.

                if (width < 0 || width > 32) {
                    throw new TypeError("Bad read width " + width);
                }

// Loop until the width is satisified.

                while (width > 0) {

// If all of the available bits have been taken, read the next byte.

                    if (available == 0) {
                        unread = reader();
                        if (unread === undefined || unread === '') {
                            throw new TypeError("Attempt to read past end.");
                        }
                        if typeof unread === 'string') {
                            if (unread.length !== 1) {
                                throw new TypeError("Data size error.");
                            }
                            unread = unread.charCodeAt(0);
                        }
                        if (typeof unread !== 'number') {
                            throw new TypeError("Data type error.");
                        }
                        if (unread < 0) {
                            unread += 256;
                        }
                        if (unread < 0 || unread >= 256) {
                            throw new TypeError("Data size error.");
                        }
                        available = 8;
                    }

// Take some bits from the current unread byte and combine them into the result.

                    take = Math.min(width, available);
                    result |= (
                        (unread >>> (available - take)) & ((1 << take) - 1)
                    ) << (width - take);
                    nr_bits += take;
                    available -= take;
                    width -= take;
                }
                return result;
            }

            function bit() {

// Read a bit, returning it as a boolean.

                return read(1) != 0;
            }

            function pad(factor) {
                var padding = factor - (nr_bits % factor),
                    result = true;

                while (padding > 0) {
                    if (bit()) {
                        result = false;
                    }
                    padding -= 1;
                }
                return result;
            }

            return {
                pad: function (size) {
                },
                unzip: function () {
                    state.generate();
                }
            };
       }
    };
}());

