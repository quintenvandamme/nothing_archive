import json

def open_file(filename):
    with open(filename, 'r', encoding="utf8") as f:
        return f.read()

def write_file(filename, data):
    with open(filename, 'w') as f:
        f.write(data)

def get_tables_of_data(data):
    tables = []
    lines = data
    current_table = []
    in_table = False

    for line in lines:
        # Check if the line is part of a table by detecting the table delimiter line
        if '|' in line:
            in_table = True
            current_table.append(line)
        else:
            # If we were in a table and encounter a non-table line, we store the table
            if in_table:
                tables.append(current_table)
                current_table = []
            in_table = False

    # If the last table reaches the end of the file without a break, add it
    if current_table:
        tables.append(current_table)
    
    return tables
   


def parse_tabledata(data):
    parsedTables = []
    tables = get_tables_of_data(data)
    for table in tables:
        parsedTabel = {}
        # remove the separator line
        table.pop(1)
        # add the header to the parsed table
        for header in table[0].split('|'):
            if header != '':
                parsedTabel[header.lower()] = []

        table.pop(0)

        # add the data to the parsed table

        for row in table:
            # remove the first and last character of the row
            row = row[1:-1]

            for i, cell in enumerate(row.split('|')):
                parsedTabel[list(parsedTabel.keys())[i]].append(cell)

        
        parsedTables.append(parsedTabel)
        
    return parsedTables

def convert_table_to_json(table):
    json = {}
    model = table['model']
    json[model] = {}
    
    for phoneTable in table['tables']:
        keys = list(phoneTable.keys())

        for row in range(len(phoneTable["version"])):
            version = phoneTable["version"][row]

            if version == "":
                version = phoneTable["build number"][row]

            if version not in json[model]:
                json[model][version] = {}
            
            # check if there is a key "build number" in the table
            if "build number" in keys:
                if row < len(phoneTable["build number"]):
                    build_number = phoneTable["build number"][row]
                    if build_number not in json[model][version]:
                        json[model][version]["build_number"] = build_number
            
            # check if there is a key "full ota" in the table

            if "full ota" in keys:
                if row < len(phoneTable["full ota"]):
                    full_ota = phoneTable["full ota"][row]
                    if full_ota not in json[model][version]:
                        otas = full_ota.split("<br>")

                        try:
                            for ota in otas:
                                region = ota.split("[")[1].split("]")[0]
                                region = region.lower().replace(" ", "").split("/")
                                url = ota.split("](")[1].split(")")[0]

                                data = {
                                    "type": "full",
                                    "region": region,
                                    "post_version": version,
                                    "url": url
                                }

                                # append the data to the json
                                if "ota" not in json[model][version]:
                                    json[model][version]["ota"] = []

                                json[model][version]["ota"].append(data)
                        except:
                            pass

            # check if there is a key "incremental ota" in the table

            if "incremental ota" in keys:
                if row < len(phoneTable["incremental ota"]):
                    incremental_ota = phoneTable["incremental ota"][row]
                    if incremental_ota not in json[model][version]:
                        otas = incremental_ota.split("<br>")

                        for ota in otas:
                            try:
                                region = ota.split("[")[1].split("from")[0].lower().replace(" ", "").split("/")
                                from_version = ota.split("from")[1].split("]")[0].replace(" ", "")
                                url = ota.split("](")[1].split(")")[0]

                                data = {
                                    "type": "incremental",
                                    "region": region,
                                    "post_version": version,
                                    "pre_version": from_version,
                                    "url": url
                                }

                                # append the data to the json
                                if "ota" not in json[model][version]:
                                    json[model][version]["ota"] = []

                                json[model][version]["ota"].append(data)
                            except:
                                pass
            
            # check if there is a key "rollback" in the table

            if "rollback" in keys:
                if row < len(phoneTable["rollback"]):
                    rollback = phoneTable["rollback"][row]
                    if rollback not in json[model][version]:
                        otas = rollback.split("<br>")

                        for ota in otas:
                            try:
                                region = ota.split("[")[1].split("to")[0].lower().replace(" ", "").split("/")
                                to_version = ota.split("to")[1].split("]")[0].replace(" ", "")

                                url = ota.split("](")[1].split(")")[0]

                                data = {
                                    "type": "rollback",
                                    "region": region,
                                    "post_version": to_version,
                                    "pre_version": version,
                                    "url": url
                                }

                                # append the data to the json
                                if "ota" not in json[model][version]:
                                    json[model][version]["ota"] = []

                                json[model][version]["ota"].append(data)
                            except:
                                pass

            if "boot file (stock)" in keys:
                if row < len(phoneTable["boot file (stock)"]):
                    boot_file = phoneTable["boot file (stock)"][row]           
                    if boot_file not in json[model][version]:
                        try:
                            url = boot_file.split("](")[1].split(")")[0]

                            data = {
                                "type": "stock",
                                "url": url
                            }

                            if "boot" not in json[model][version]:
                                json[model][version]["boot"] = []

                            json[model][version]["boot"].append(data)
                        except:
                            pass

            if "boot file (magisk patched)" in keys:
                if row < len(phoneTable["boot file (magisk patched)"]):
                    boot_file = phoneTable["boot file (magisk patched)"][row]           
                    if boot_file not in json[model][version]:
                        try:
                            url = boot_file.split("](")[1].split(")")[0]

                            data = {
                                "type": "magisk patched",
                                "url": url
                            }

                            if "boot" not in json[model][version]:
                                json[model][version]["boot"] = []

                            json[model][version]["boot"].append(data)
                        except:
                            pass
    
    return json

def main():
    data = []
    readme = open_file('README.md')
    lines = readme.split('\n')
    for line in lines:
        if "## " in line.lower() and "phone" in line.lower():
            model = line.split('## ')[1].lower()
            modelData = {}
            modelData['model'] = model
            modelData['data'] = []

            # make a line loop again but start from the current index
            for i in range(lines.index(line) + 1, len(lines)):
                if not lines[i].startswith("## "):
                    if not lines[i].startswith("### "):
                        modelData['data'].append(lines[i])
                else:
                    data.append(modelData)
                    break

    for phoneData in data:
        parsedTables = parse_tabledata(phoneData['data'])
        phoneData.pop('data')
        phoneData['tables'] = parsedTables

    parsedJson = []

    for phoneData in data:
        jsonData = convert_table_to_json(phoneData)
        parsedJson.append(jsonData)

    write_file('nothing.json', json.dumps(parsedJson, indent=4))
        
                       

if __name__ == '__main__':
    main()