/* jshint multistr:true */

var csvContent;
var data = [];
var studyDataJSON = [];
var tableReady = false;
var table = $('#myTable').DataTable();
var rowPos = 0;
var orgCSVFilename;
var keys = [];
var newDataLoaded = true;
var sessionInfo;

function downloadCSV(args) {
    var data, filename, link;

    // csv = csvContent;
    csv = convertArrayOfObjectsToCSV({
        data: studyDataJSON
    });

    if (csv == null) return;

    filename = args.filename || orgCSVFilename.replace(".csv", "") + '_scored.csv';

    if (isSafariBrowser()) {
        if (!csv.match(/^data:text\/csv/i)) {
            csv = 'data:text/csv;charset=utf-8,' + csv;
        }
        data = encodeURI(csv);
        $("#download_link").attr("href", data);
        $("#download_link").attr("download", filename);
        $("#download_link").html("Click to download");
        $('#safari_download').modal('show');
    } else {
        var blob = new Blob([csv], {
            type: "data:text/csv;charset=utf-8"
        });
        saveAs(blob, filename);
    }
}

function readSingleStudyCsvFile(fp) {

    if (fp) {

        if ('name' in fp) {
            orgCSVFilename = fp.name.toLowerCase();
        } else {
            orgCSVFilename = fp.fileName.toLowerCase();
        }

        console.log("File Name: " + orgCSVFilename);

        var r = new FileReader();

        r.onload = function (e) {
            var contents = e.target.result;
            csvContent = contents;

            studyDataJSON = JSON.parse(generateStudyDataJSON(csvContent));
            newDataLoaded = true;
            populateTableWithJSON(studyDataJSON);
            rowPos = 0;
        };

        r.readAsText(fp);

    } else {
        console.log("Failed to load file");
    }
}

function readStudyCsvFiles(evt) {

    // if at least one file was selected
    if (evt.target.files.length > 0) {

        var fp;

        // if only one file was selected
        if (evt.target.files.length == 1) {
            // Retrieve the first (and only!) File from the FileList object
            fp = evt.target.files[0];
            readSingleStudyCsvFile(fp);
        } else {

            // Start timer
            console.time('StartCalc');
            
            // counter for processed files
            var processedFiles = 0;
            // create Zip file to put the scored CSV files
            var zip = new JSZip();

            var r;

            // loop for each selected file
            for (var x = 0; x < evt.target.files.length; x++) {

                // Retrieve the File from the FileList object
                fp = evt.target.files[x];

                if (fp) {

                    r = new FileReader();

                    if ('name' in fp) {
                        orgCSVFilename = fp.name.toLowerCase();
                        // console.log("name: " + orgCSVFilename);
                    } else {
                        orgCSVFilename = fp.fileName.toLowerCase();
                        // console.log("fileName: " + orgCSVFilename);
                    }

                    r.onload = (function (f) {
                        return function (e) {

                            var csvContent = e.target.result;
                            var studyDataJSON = JSON.parse(generateStudyDataJSON(csvContent));

                            for (var index in studyDataJSON) {
                                var target = studyDataJSON[index].target;
                                var response = studyDataJSON[index].response;

                                studyDataJSON[index].robot = getScore(target, response);

                                if (studyDataJSON[index].human != studyDataJSON[index].robot) {
                                    studyDataJSON[index].disagree = 'true';
                                } else {
                                    studyDataJSON[index].disagree = 'false';
                                }
                            }

                            var csv = convertArrayOfObjectsToCSV({
                                data: studyDataJSON
                            });

                            // if (csv == null) return;

                            var filename = f.name.replace(".csv", "") + '_scored.csv';

                            // add scored CSV file to the Zip
                            zip.file(filename, csv);
                            processedFiles++;
                        };
                    })(fp);

                    r.readAsText(fp);

                } else {
                    console.log("Failed to load file");
                }
            }

            r.onloadend = function (f) {
                // if all CSV files were processed
                if (processedFiles == evt.target.files.length) {

                    if (isSafariBrowser()) {
                        // console.log("Save For Safari!!!");
                        zip.generateAsync({
                                type: "blob"
                            })
                            .then(function (content) {
                                // console.log(content);
                                // saveAs(content, "scored_files.zip");
                            });
                    } else {
                        // save Zip file
                        zip.generateAsync({
                                type: "blob"
                            })
                            .then(function (content) {
                                // console.log(content);
                                console.timeEnd('StartCalc');
                                saveAs(content, "scored_files.zip");
                            });
                    }
                }
            };
        }
    } else {
        console.log('No file was selected');
    }

}

function readTargetsCsvFile(evt) {

    // if at least one file was selected
    if (evt.target.files.length > 0) {

        // if only one file was selected
        if (evt.target.files.length == 1) {
            // Retrieve the first (and only!) File from the FileList object
            var fp = evt.target.files[0];

            if (fp) {

                if ('name' in fp) {
                    orgCSVFilename = fp.name.toLowerCase();
                } else {
                    orgCSVFilename = fp.fileName.toLowerCase();
                }

                console.log("Targets/Variants File Name: " + orgCSVFilename);

                var r = new FileReader();

                r.onload = function (e) {
                    var contents = e.target.result;

                    // TODO: Generate Targets/Variants object variable
                    console.log('Targets/Variants file is ready');
                    variantsJSONList = JSON.parse(generateTargetDataJSON(contents));
                    console.log(variantsJSONList);
                    loadVariantsObject(variantsJSONList);
                    console.log(variantsObj);
                    // newTargetDataLoaded = true;
                };

                r.readAsText(fp);

            } else {
                console.log("Failed to load file");
            }
        }
    } else {
        console.log('No file was selected');
    }

}

function convertArrayOfObjectsToCSV(args) {
    var result, ctr, keys, columnDelimiter, lineDelimiter, data;

    data = args.data || null;
    if (data == null || !data.length) {
        return null;
    }

    columnDelimiter = args.columnDelimiter || ',';
    lineDelimiter = args.lineDelimiter || '\n';

    keys = Object.keys(data[0]);
    // console.log(keys);
    // headers = titleCase(keys.join(",").replace(',,', ',unknown,'), ',').split(',');
    headers = titleCase(keys.join(","), ',').split(',');
    // console.log(headers);

    result = '';
    result += headers.join(columnDelimiter);
    result += lineDelimiter;

    data.forEach(function (item) {
        ctr = 0;
        keys.forEach(function (key) {
            if (ctr > 0) result += columnDelimiter;

            result += item[key];
            ctr++;
        });
        result += lineDelimiter;
    });

    // console.log(result);
    return result;
}

function titleCase(str, delimiter) {

    // Step 1. Lowercase the string
    str = str.toLowerCase() // str = "i'm a little tea pot";

        // Step 2. Split the string into an array of strings
        .split(delimiter) // str = ["i'm", "a", "little", "tea", "pot"];
        // console.log(str);

        // Step 3. Map over the array
        .map(function (word) {
            return word.replace(word[0], word[0].toUpperCase());
            /* Map process
            1st word: "i'm" => word.replace(word[0], word[0].toUpperCase());
                               "i'm".replace("i", "I");
                               return word => "I'm"
            2nd word: "a" => word.replace(word[0], word[0].toUpperCase());
                             "a".replace("a", "A");
                              return word => "A"
            3rd word: "little" => word.replace(word[0], word[0].toUpperCase());
                                  "little".replace("l", "L");
                                  return word => "Little"
            4th word: "tea" => word.replace(word[0], word[0].toUpperCase());
                               "tea".replace("t", "T");
                               return word => "Tea"
            5th word: "pot" => word.replace(word[0], word[0].toUpperCase());
                               "pot".replace("p", "P");
                               return word => "Pot"                                                        
            End of the map() method */
        });

    // Step 4. Return the output
    return str.join(delimiter); // ["I'm", "A", "Little", "Tea", "Pot"].join(' ') => "I'm A Little Tea Pot"
}

function generateTableHTML(data) {

    var rows = data.split("\r");

    var tableData = "<thead>\
                    <tr>\
                        <th data-field='id' data-sortable='true'>#</th>\
                        <th data-field='target' data-sortable='true'>Target</th>\
                        <th data-field='response' data-sortable='true'>Response</th>\
                        <th data-field='human' data-sortable='true'>Human</th>\
                        <th data-field='robot' data-sortable='true'>Robot</th>\
                    </tr>\
                    </thead>\
                    <tbody>";

    $.each(rows, function (index, value) {
        // console.log(index + ": " + value);
        // ignore the header row
        if (!value.toLowerCase().includes("id,type,file")) {
            var columns = value.split(",");

            if (columns.length > 1) {
                // tableData += "<tr><th scope='row' class='col-md-1'>" + (index) + "</th>";
                tableData += "<tr><th scope='row'>" + (index) + "</th>";
                $.each(columns, function (index, value) {
                    if (index == 3 || index == 4) {
                        tableData += "<td>" + (value) + "</td>";
                        // console.log(index + ": " + value);
                    }
                });

                tableData += "<td class='text-center'>0</td><td class='text-center'>0</td></tr>";
            }
        }
    });

    tableData += "</tbody>";
    return tableData;

}

function generateStudyDataJSON(csvData) {

    // trying to accomodate every possible new line charadter
    var rows = csvData.split(/\r\n|[\n\v\f\r\x85\u2028\u2029]/);

    // open the JSON array
    var strWithJSON = "[";

    $.each(rows, function (index, value) {
        // console.log(index + ": " + value);
        // if the header row then create the keys
        var i, x;

        if (index == 0) {
            if (value.toLowerCase().includes("target,response")) {
                keys = value.toLowerCase().split(",");
                if (keys.includes("")) {
                    x = 1;
                    for (i = 0; i < keys.length; i++) {
                        if (keys[i] == "") {
                            keys[i] = "unknown_" + x++;
                        }
                    }
                }
                return;
            } else {
                keys = value.toLowerCase().split(",");
                if (keys.includes("")) {
                    x = 1;
                    for (i = 0; i < keys.length; i++) {
                        if (keys[i] == "") {
                            keys[i] = "unknown_" + x++;
                        }
                    }
                }
            }
        }

        var result = deleteCommasInDoubleQuotes(value);

        // get rid of the double quotes
        result = result.replace(/["]/g, "");

        var columns = result.split(",");

        if (columns.length > 1) {

            if (!keys.includes('index')) {
                strWithJSON += '{"index": "' + index + '",';
            } else {
                strWithJSON += '{';
            }

            $.each(columns, function (ix, val) {
                strWithJSON += '"' + keys[ix] + '": "' + scapeDoubleQuotes(val) + '",';
            });

            if (!keys.includes('human')) {
                strWithJSON += '"human" : "0",';
            }

            if (!keys.includes('robot')) {
                strWithJSON += '"robot" : "0",';
            }

            if (!keys.includes('disagree')) {
                strWithJSON += '"disagree": "false"},';
            } else {
                // eliminate trailing comma and close the object
                strWithJSON = strWithJSON.replace(/(^,)|(,$)/g, "");
                strWithJSON += '},';
            }
        }
    });

    // eliminate trailing comma and close the array
    strWithJSON = strWithJSON.replace(/(^,)|(,$)/g, "");
    strWithJSON += "]";

    return strWithJSON;
}

function generateTargetDataJSON(csvData) {

    // trying to accomodate every possible new line charadter
    var rows = csvData.split(/\r\n|[\n\v\f\r\x85\u2028\u2029]/);

    // open the JSON array
    var strWithJSON = "[";

    $.each(rows, function (index, value) {
        // console.log(index + ": " + value);
        // if the header row then create the keys
        var i, x;

        var result = deleteCommasInDoubleQuotes(value);

        // get rid of the double quotes
        result = result.toLowerCase().replace(/["]/g, "");

        var columns = result.split(",");

        if (columns.length > 0) {

            strWithJSON += '{"index": "' + index + '",';
            strWithJSON += '"target": "' + columns[0] + '",';
            strWithJSON += '"variants": [';
            
            for (i = 1; i < columns.length; i++) {
                if (columns[i] != '') {
                    strWithJSON += '"' + scapeDoubleQuotes(columns[i]) + '",';
                }
            }
            
            // eliminate trailing comma and close the object
            strWithJSON = strWithJSON.replace(/(^,)|(,$)/g, "");
            strWithJSON += ']},';
        }
    });

    // eliminate trailing comma and close the array
    strWithJSON = strWithJSON.replace(/(^,)|(,$)/g, "");
    strWithJSON += "]";

    return strWithJSON;
}

function populateTableWithJSON(studyDataJSON) {

    var columns = [];
    var headers = "";

    if (sessionInfo.role === 'user') {
        columns = [{
                data: 'index'
            },
            {
                data: 'target'
            },
            {
                data: 'response'
            },
            {
                data: 'human'
            }
        ];
        headers = "<tr>\
                        <th>#</th>\
                        <th>Target</th>\
                        <th>Response</th>\
                        <th>Score</th>\
                     </tr>";

        $("#human_label").html("Score");

    } else {
        columns = [{
                data: 'index'
            },
            {
                data: 'target'
            },
            {
                data: 'response'
            },
            {
                data: 'human'
            },
            {
                data: 'robot'
            }
        ];
        headers = "<tr>\
                        <th>#</th>\
                        <th>Target</th>\
                        <th>Response</th>\
                        <th>Human</th>\
                        <th>Robot</th>\
                     </tr>";
    }

    $('#table_header').html(headers);

    table.destroy();
    // table = $('#myTable').DataTable();
    table = $('#myTable').DataTable({
        data: studyDataJSON,
        columns: columns,
        stateSave: true,
        "createdRow": function (row, data, index) {
            if (sessionInfo.role !== 'user') {
                if (studyDataJSON[index].human != studyDataJSON[index].robot) {
                    // $('td', row).eq(0).removeClass('sorting_1');
                    $('td', row).addClass('highlight');
                }
            }
        }
    });

    if (newDataLoaded) {
        newDataLoaded = false;
        table.page('first').draw('page');
    }

    // $('#myTable').on('page.dt', function () {
    //     var info = table.page.info();
    //     console.log( 'Showing page: ' + info.page + ' of ' + info.pages );
    // });
}

function populateTableWithHTML(data) {

    $('#myTable').empty();
    $('#myTable').html(data);

    table.destroy();
    table = $('#myTable').DataTable();
}

function addClickOnRowEventToTable() {
    var t = document.getElementById('myTable');

    t.onclick = function (event) {
        event = event || window.event; //IE8
        var eventTarget = event.target || event.srcElement;

        while (eventTarget && eventTarget.nodeName != 'TR') { // find TR
            eventTarget = eventTarget.parentElement;
        }

        // if (!eventTarget) { return; } // tr should be always found
        var cells = eventTarget.cells; // cell collection - https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableRowElement
        // var cells = eventTarget.getElementsByTagName('td'); //alternative
        if (!cells.length || eventTarget.parentNode.nodeName == 'THEAD') {
            return;
        }

        // get data from table
        var index = cells[0].innerHTML;
        var target = cells[1].innerHTML;
        var response = cells[2].innerHTML;
        var matched = JSON.stringify(getMatchedWords(target, response));
        console.log(getMatchedWords(target, response));
        
    };

    t.ondblclick = function (event) {
        event = event || window.event; //IE8
        var eventTarget = event.target || event.srcElement;

        while (eventTarget && eventTarget.nodeName != 'TR') { // find TR
            eventTarget = eventTarget.parentElement;
        }

        // if (!eventTarget) { return; } // tr should be always found
        var cells = eventTarget.cells; // cell collection - https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableRowElement
        // var cells = eventTarget.getElementsByTagName('td'); //alternative
        if (!cells.length || eventTarget.parentNode.nodeName == 'THEAD') {
            return;
        }

        rowPos = parseInt(cells[0].innerHTML) - 1;

        $('#myModal').modal('show');
        $("#mod_index").html("Row " + (rowPos + 1) + " of " + studyDataJSON.length);
        $("#mod_target").html(studyDataJSON[rowPos].target);
        $("#mod_response").html(studyDataJSON[rowPos].response);
        $("#mod_human").html(studyDataJSON[rowPos].human);
        $("#mod_robot").html(studyDataJSON[rowPos].robot);

    };
}

function scapeDoubleQuotes(str) {
    return (str + '').replace(/[\\"]/g, '\\$&').replace(/\u0000/g, '\\0');
}

// http://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser
function isSafariBrowser() {
    // Check if the browser is Safari 3.0+ 
    var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0 ||
        (function (p) {
            return p.toString() === "[object SafariRemoteNotification]";
        })(!window.safari || safari.pushNotification);

    // console.log('Is safary: ' + isSafari);
    return isSafari;
}

$(function () {

    sessionInfo = readCookie();
    // console.log(sessionInfo);

    // hide options depending on roles
    if (sessionInfo.role === 'user') {
        console.log('User');
        $(".admin").hide();
        $(".robot").hide();
    } else if (sessionInfo.role === 'researcher') {
        console.log('Researcher');
        // $('#edit_options').hide();
        $(".admin").hide();
    }

    $('[data-toggle="tooltip"]').tooltip();
    // loadVariantsJSON();

    $("#myModal").keydown(function (e) {

        if (!e) {
            e = event;
        }

        var keyPressed = String.fromCharCode(e.which);

        // check for the arrows
        switch (e.which) {
            case 38: // Up arrow
                if (rowPos > 0) {
                    rowPos--;
                }
                break;
            case 40: // Down arrow
                if (rowPos < studyDataJSON.length - 1) {
                    rowPos++;
                }
                break;
            default:
                // if it is a digit then save the info
                if (e.which >= 48 && e.which <= 57) {
                    studyDataJSON[rowPos].human = e.which - 48;
                }
                break;
        }

        if (studyDataJSON[rowPos].human != studyDataJSON[rowPos].robot) {
            studyDataJSON[rowPos].disagree = 'true';
        } else {
            studyDataJSON[rowPos].disagree = 'false';
        }

        // if the key is a digit
        if (rowPos >= 0 && rowPos < studyDataJSON.length) {
            $("#mod_index").html("Row " + (rowPos + 1) + " of " + studyDataJSON.length);
            $("#mod_target").html(studyDataJSON[rowPos].target);
            $("#mod_response").html(studyDataJSON[rowPos].response);
            $("#mod_human").html(studyDataJSON[rowPos].human);
            $("#mod_robot").html(studyDataJSON[rowPos].robot);
        }

        e.preventDefault();
    });

    $("#show_modal").click(function () {
        if (studyDataJSON.length > 0) {
            $('#myModal').modal('show');
            $("#mod_index").html("Row " + (rowPos + 1) + " of " + studyDataJSON.length);
            $("#mod_target").html(studyDataJSON[rowPos].target);
            $("#mod_response").html(studyDataJSON[rowPos].response);
            $("#mod_human").html(studyDataJSON[rowPos].human);
            $("#mod_robot").html(studyDataJSON[rowPos].robot);
        } else {
            alert("No data loaded from CSV...");
        }
    });


    $("#calc_score").click(function () {
        // var target = "avoid or beat command";
        // var response = "avoid or break comand";
        // target = "connect the beer device";
        // response = "connect new device the";
        // target = "define respect instead";
        // response = "he respect finds respect inside";
        // target = "advance but sat appeal";
        // response = "advance what is set apeel";

        for (var index in studyDataJSON) {
            var target = studyDataJSON[index].target;
            var response = studyDataJSON[index].response;

            studyDataJSON[index].robot = getScore(target, response);

            if (studyDataJSON[index].human != studyDataJSON[index].robot) {
                studyDataJSON[index].disagree = 'true';
            } else {
                studyDataJSON[index].disagree = 'false';
            }
        }

        if (studyDataJSON.length > 0) {
            populateTableWithJSON(studyDataJSON);
        }

    });

    $("#save_changes, #dismiss_modal, #close_modal").click(function () {

        if (studyDataJSON.length > 0) {
            $('#myModal').modal('toggle');
            populateTableWithJSON(studyDataJSON);
        } else {
            alert("No data loaded from CSV...");
        }
    });

    // add event listeners for the inputs
    $("#study_fileinput").change(readStudyCsvFiles);
    $("#targets_fileinput").change(readTargetsCsvFile);

    addClickOnRowEventToTable();
});