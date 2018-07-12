# RENAME TOOL - README
This tool can be used to rename multiple file names and their contents based on a CSV-file. The content of each file in the ./template folder is checked for placeholders. The placeholders will be replaced with the data as specified in the CSV file.


## Example

The CSV file contains the following data:
``` csv
PLACEHOLDER_01;PLACEHOLDER_02;
exampleA;ExampleB
```

In the ./template directory the following file is defined: File___PLACEHOLDER_01__.txt with content:
``` txt
This is an example for __PLACEHOLDER_01__ and __PLACEHOLDER_02__.
```

When running this application, a file will be generated in the ./output folder named File_exampleA.txt
The contents of this file will be:
``` txt
This is an example for exampleA and ExampleB
```


## Configuration parameters:
The following parameters can be provided:
* help
  For getting information about this application
* contents
   Filename of the contents csv file (default value is 'content.csv'). Note that the filename is always relative to the folder in which the application is executed.
* templates_folder
  Directory that stores the template files (default value is 'templates'). Note that the directory is always relative to the folder in which the application is executed.
* output_folder
  Directory in which the output will be stored (default value is 'output'). Important note: Contents in this directory will be removed before the output will be stored. This folder needs to exist.
* delimiter
  The CSV delimiter (default value is ';').
* placeholder
  The placeholder pattern (default value is '__'). This means that the column headers of the CSV will be prefixed and suffixed with this value. Thus if the CSV header is 'ABC' then the placeholder in the template will be __ABC__.


## Usage:
To execute the tool, use a command line:

standard functionality 
``` cmd
node app.js
```

Opening the help file
``` cmd
node app.js help
```

Change the contents CSV filename
``` cmd
node app.js contents=abc.csv
```

Change the contents CSV file name and the CSV delmiter
``` cmd
node app.js contents=abc.csv delimiter=","
``` cmd
