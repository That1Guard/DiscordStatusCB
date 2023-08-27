// this is just a workaround Asc() not working
public def Ascii(ch)
    for i=0; i<=255; i++
        ch2 = Chr(i)
        if ch == ch2 then
            return i
        end
    end
    return -1
end

public def PokeString(bnk, offset, value)
    length = len value
    PokeShort(bnk, offset, length)
    for i=0; i<length; i++
        ch = Mid(value, i + 1, 1)
        a = Ascii(ch)
        PokeByte(bnk, offset + i + 2, a)
    end
end

public def PeekString(bnk, offset)
    data = ""
    length = PeekShort(bnk, offset)
    for i=0; i<length; i++
        b = PeekByte(bnk, offset + i + 2)
        c = Chr(b)
        data = data + c
    end
    return data
end

public def SplitStr(text, ch)
    local a = []
    local i = 1
    while true
        local sloc = InStr(text, ch, i)
        if sloc == 0 then
            local l2 = len text
            local st = Mid(text, i, l2 - i + 1)
            addarrayelements(a, 1)
            local lt = len a
            a[lt - 1] = st
            break
        end
        local s = Mid(text, i, sloc - i)
        addarrayelements(a, 1)
        local l = len a
        a[l - 1] = s
        i = sloc + 1
    end
    return a
end