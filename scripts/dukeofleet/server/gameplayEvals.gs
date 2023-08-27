def CheckKeyCardLvl(itemid)
    local keyReturn = 0
    local tempID = GetItemTemplate(itemid)
    local tempTempName = GetItemTemplateTempName(tempID)
    select tempTempName
        case "key1"
            keyReturn = 1
        case "key2"
            keyReturn = 2
        case "key3"
            keyReturn = 3
        case "key4"
            keyReturn = 4
        case "key5"
            keyReturn = 5
        case "key6"
            keyReturn = 6
    end
    return keyReturn
end

def ValidateCheckWeaponData(primary, secondary, explosive)
    if not primary >= 0 and not primary < 5
        return 0
    end

    if not secondary >= 0 and not secondary < 5
        return 0
    end

    if not explosive >= 0 and not explosive < 4
        return 0
    end
    return 1
end