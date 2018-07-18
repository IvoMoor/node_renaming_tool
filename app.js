const fs = require('fs');
const path = require('path');
const csv = require('csvtojson');
const clc = require('cli-color');

let cfg = getConfiguration();

if (verifyConfiguration(cfg)) {
  clearOutputDirectory(cfg.dirOutput);

  csv({ delimiter: cfg.csvDelimiter })
    .fromFile('./' + cfg.fileContent)
    .then(fileContentJSON => {
      fs.readdir(cfg.dirTemplates, (err, files) => {
        files.forEach((file, index) => {
          let fileTemplatePath = path.join(cfg.dirTemplates, file);
          if (
            fs.statSync(fileTemplatePath).isDirectory() ||
            file === '.gitkeep'
          ) {
            return;
          }

          // replace the placeholders in the contents of the file
          let templateFileContent = fs.readFileSync(fileTemplatePath);
          fileContentJSON.forEach(contentRow => {
            let outputFileContent = templateFileContent.toString();
            let outputFileName = file.toString();

            for (const placeholder in contentRow) {
              if (contentRow.hasOwnProperty(placeholder)) {
                let regex = new RegExp(
                  cfg.placeholderPattern + placeholder + cfg.placeholderPattern,
                  'g'
                );
                outputFileName = outputFileName.replace(
                  regex,
                  contentRow[placeholder]
                );
                outputFileContent = outputFileContent.replace(
                  regex,
                  contentRow[placeholder]
                );
              }
            }

            // wriite output file
            fs.writeFileSync(
              path.join(cfg.dirOutput, outputFileName),
              outputFileContent
            );

            console.log(
              clc.green(
                'Output file created: ./' + cfg.dirOutput,
                outputFileName + '.'
              )
            );
          });
        });
      });
    });
}

function getConfiguration() {
  let cfg = {};

  // help parameters
  const helpParameters = ['-h', '-help', 'help', "?", '--help'];

  // parameter configuration
  const paramConfig = [{
    name: "dirTemplates",
    description: "template directory",
    defaultValue: 'templates',
    parameterIds: ['-t', '-template_dir']
  }, {
    name: "dirOutput",
    description: "output directory",
    defaultValue: 'output',
    parameterIds: ['-o', '-output']
  }, {
    name: "fileContent",
    description: "file with content",
    defaultValue: 'content.csv',
    parameterIds: ['-c', '-content']
  }, {
    name: "csvDelimiter",
    description: "csv delimiter",
    defaultValue: ';',
    parameterIds: ['-d', '-delimiter']
  }, {
    name: "placeholderPattern",
    description: "placeholder pattern",
    defaultValue: '__',
    parameterIds: ['-p', '-placeholder']
  }
  ];

  // set the default values
  paramConfig.forEach((param) => {
    cfg[param.name] = param.defaultValue;
  });

  // check if parameters are overruled by the user
  for (let i = 0; i < process.argv.length; i++) {
    let param = process.argv[i];

    // check if the help needs to be displayed
    if (helpParameters.indexOf(param) > -1) {
      cfg.showHelp = true;
      return cfg;
    }

    // set the parameter to the configuration
    let paramValue = (i === process.argv.length) ? null : process.argv[i + 1];
    for (let y = 0; y < paramConfig.length; y++) {
      if (paramConfig[y].parameterIds.indexOf(param) > -1) {
        cfg[paramConfig[y].name] = paramValue;

        if (paramValue) {
          console.log(
            clc.blue(
              'Changing ' + paramConfig[y].description + ' to ' +
              paramValue.toString() +
              '.'
            )
          );
        }
      }
    }
  }

  return cfg;
}

function verifyConfiguration(cfg) {
  if (cfg.showHelp) {
    showHelp();
    return;
  }

  // check if the file delivering the content is found
  if (!fs.existsSync('./' + cfg.fileContent)) {
    fs.writeFileSync('./' + cfg.fileContent, "");
    console.log(clc.green('Created content file: ./' + cfg.fileContent.toString()));
  }

  // check if the templates directory exists
  if (!fs.existsSync('./' + cfg.dirTemplates)) {
    fs.mkdirSync('./' + cfg.dirTemplates);
    console.log(clc.green('Created template directory: ./' + cfg.dirTemplates.toString()));
  }

  // check if output directory exists
  if (!fs.existsSync('./' + cfg.dirOutput)) {
    fs.mkdirSync('./' + cfg.dirOutput);
    console.log(clc.green('Created output directory: ./' + cfg.dirOutput.toString()));
  }

  return true;
}


function showHelp() {
  console.log(`
  RENAME TOOL - README
  This tool can be used to rename multiple file names and their contents based on a CSV-file. The content of
  each file in the ./template folder is checked for placeholders. The placeholders will be replaced with the
  data as specified in the CSV file.

  -----------------------------------------------------------------------------------------------------------
  Example:
  -----------------------------------------------------------------------------------------------------------
  The CSV file contains the following data:
  PLACEHOLDER_01;PLACEHOLDER_02;
  exampleA;ExampleB

  In the ./template directory the following file is defined: File___PLACEHOLDER_01__.txt with content:
  This is an example for __PLACEHOLDER_01__ and __PLACEHOLDER_02__.

  When running this application, a file will be generated in the ./output folder named File_exampleA.txt
  The contents of this file will be:
  This is an example for exampleA and ExampleB
  -----------------------------------------------------------------------------------------------------------


  Configuration parameters:
  The following parameters can be provided:
    --help
      For getting information about this application

    -c or -content
      Filename of the contents csv file (default value is 'content.csv'). Note that the filename is always
      relative to the folder in which the application is executed.

    -t or -templates
      Directory that stores the template files (default value is 'templates'). Note that the directory is
      always relative to the folder in which the application is executed.

    -o or -output
      Directory in which the output will be stored (default value is 'output'). Important note: Contents
      in this directory will be removed before the output will be stored. This folder needs to exist.

    -d or -delimiter
      The CSV delimiter (default value is ';').

    -p or -placeholder
      The placeholder pattern (default value is '__'). This means that the column headers of the CSV
      will be prefixed and suffixed with this value. Thus if the CSV header is 'ABC' then the placeholder
      in the template will be __ABC__.



  Usage:
  To execute the tool, use a command line:
    node app.js                                    --> for the standard functionality
    node app.js --help                             --> for opening the help file
    node app.js -content abc.csv                   --> for changing the contents CSV file
    node app.js -c abc.csv                         --> for changing the contents CSV file
    node app.js -c abc.csv -d ","                  --> for changing the contents CSV and the delimiter
`);
}


function clearOutputDirectory(outputDirPath) {
  fs.readdir('./' + outputDirPath, (err, files) => {
    files.forEach((file, index) => {
      fs.unlink(path.join('./' + outputDirPath, file), err => {
        if (err) {
          throw 'Unable to delete file ./' + outputDirPath + '/' + file;
        }
      });
    });
  });
}
