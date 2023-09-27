public def Ascii(ch)
    for i = 0; i < 256; i++
        ch2 = Chr(i)
        if ch == ch2 then
            return i
        end
    end
    return -1
end

public def SanitizeAndValidate(stringInput)
    const allowedStringChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 "
    local allowedCharsLength = len allowedStringChars
    local length = len stringInput
    local sanitized = ""

    for i = 1; i < length + 1; i++
        local char = Mid(stringInput, i, 1)
//		Print("Result Char at step " + i +" : " + char)
		
        for k = 1; k < allowedCharsLength + 1; k++
            local stringWhitelistCheck = Mid(allowedStringChars, k, 1)
            if char == stringWhitelistCheck 
                sanitized = sanitized + char
//				print("Result Allowed Char at step " + i +", sub-step " + k + " : " + char)
                break
            end
        end
    end
	
//	print("Final Sanitization: " + sanitized)
    return sanitized
end

public def SanitizeAndValidateIP(stringInput)
    const allowedIpChars = "0123456789."
    local allowedCharsLength = len allowedIpChars
    local length = len stringInput
    local sanitized = ""

    for i = 1; i < length + 1; i++
        local char = Mid(stringInput, i, 1)
//		Print("Result Char at step " + i +" : " + char)
		
        for k = 1; k < allowedCharsLength + 1; k++
            local stringWhitelistCheck = Mid(allowedIpChars, k, 1)
            if char == stringWhitelistCheck 
                sanitized = sanitized + char
//				print("Result Allowed Char at step " + i +", sub-step " + k + " : " + char)
                break
            end
        end
    end
	
//	print("Final Sanitization: " + sanitized)
    return sanitized
end

def IsPlayerValid(playerid)
	if MAX_PLAYERS > playerid and playerid > 0
		return IsPlayerConnected(playerid)
	end
	return 0
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

// By Ne4to
def split(s, entry, char)
    while Instr(s,char+char, 1)
        s = Replace(s, char+char,char)
    end
    for n = 1; n < entry; n++
        p = Instr(s, char, 1)
        s = Right(s, Len s-p)
    end
    p = Instr(s, char, 1)
    If p < 1 then
        a = s
    else
        a = Left(s,p-1)
    end
    return a
end

// Selects a value based on a condition's truthiness.
// Parameters:
// - condition (numeric): The condition to evaluate. If true, 'trueValue' will be returned,
//                    otherwise, 'falseValue' will be returned.
// - trueValue (any): The value to return if 'condition' is true.
// - falseValue (any): The value to return if 'condition' is false.
// Returns:
// - any: Either 'trueValue' or 'falseValue' based on the evaluation of 'condition'.
def IfCondition(condition, trueValue, falseValue)
    if condition > 0
        return  trueValue
    else
        return falseValue
    end
end