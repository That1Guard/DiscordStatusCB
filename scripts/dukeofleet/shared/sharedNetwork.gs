////// NETWORK FUNCTIONS //////
// These functions are shared and used for interfacing the network.

public def PokeString(bnk, offset, value)
    local length = len value
    PokeShort(bnk, offset, length)
    for i = 0; i < length; i++
        ch = Mid(value, i + 1, 1)
        a = Ascii(ch)
        PokeByte(bnk, offset + i + 2, a)
    end
end

public def PeekString(bnk, offset)
    local data = ""
    local length = PeekShort(bnk, offset)
    for i = 0; i < length; i++
        b = PeekByte(bnk, offset + i + 2)
        c = Chr(b)
        data = data + c
    end
    return data
end