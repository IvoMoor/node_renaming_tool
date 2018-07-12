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
      // loop over each template to change the filename and the file contents based on the placeholders
      fs.readdir(cfg.dirTemplates, (err, files) => {
        files.forEach((file, index) => {
          let fileTemplatePath = path.join(cfg.dirTemplates, file);

          // skip directories
          if (
            fs.statSync(fileTemplatePath).isDirectory() ||
            fileTemplatePath === '.gitkeep'
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
  let cfg = {
    dirTemplates: 'templates',
    dirOutput: 'output',
    fileContent: 'content.csv',
    csvDelimiter: ';',
    placeholderPattern: '__',
    showHelp: false
  };

  // user parameters
  process.argv.forEach(function(val, index, array) {
    if (
      val.substring(0, 4).toLowerCase() === 'help' ||
      val.substring(0, 1).toLowerCase() === '?'
    ) {
      cfg.showHelp = true;
      return;
    }

    if (
      val.substring(0, 17).toLowerCase() === 'templates_folder=' &&
      val.split('=').length > 1
    ) {
      cfg.dirTemplates = val.split('=')[1];

      console.log(
        clc.blue(
          'Changing template directory to ./' +
            cfg.dirTemplates.toString() +
            '.'
        )
      );
    }

    if (
      val.substring(0, 14).toLowerCase() === 'output_folder=' &&
      val.split('=').length > 1
    ) {
      cfg.dirOutput = val.split('=')[1];

      console.log(
        clc.blue(
          'Changing output directory to ./' + cfg.dirOutput.toString() + '.'
        )
      );
    }

    if (
      val.substring(0, 9).toLowerCase() === 'contents=' &&
      val.split('=').length > 1
    ) {
      cfg.fileContent = val.split('=')[1];

      console.log(
        clc.blue(
          'Changing content file to ./' + cfg.fileContent.toString() + '.'
        )
      );
    }

    if (
      val.substring(0, 10).toLowerCase() === 'delimiter=' &&
      val.split('=').length > 1
    ) {
      cfg.csvDelimiter = val.split('=')[1];

      console.log(
        clc.blue(
          'Changing CSV delimiter to ' + cfg.csvDelimiter.toString() + '.'
        )
      );
    }

    if (
      val.substring(0, 20).toLowerCase() === 'placeholder_pattern=' &&
      val.split('=').length > 1
    ) {
      cfg.placeholderPattern = val.split('=')[1];

      console.log(
        clc.blue(
          'Changing placeholder patttern to ' +
            cfg.csvDelimiter.toString() +
            '.'
        )
      );
    }
  });

  return cfg;
}

function verifyConfiguration(cfg) {
  // check if help needs to be displayed
  if (cfg.showHelp) {
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
        help
          For getting information about this application

        contents
          Filename of the contents csv file (default value is 'content.csv'). Note that the filename is always
          relative to the folder in which the application is executed.

        templates_folder
          Directory that stores the template files (default value is 'templates'). Note that the directory is
          always relative to the folder in which the application is executed.

        output_folder
          Directory in which the output will be stored (default value is 'output'). Important note: Contents
          in this directory will be removed before the output will be stored. This folder needs to exist.

        delimiter
          The CSV delimiter (default value is ';').

        placeholder
          The placeholder pattern (default value is '__'). This means that the column headers of the CSV
          will be prefixed and suffixed with this value. Thus if the CSV header is 'ABC' then the placeholder
          in the template will be __ABC__.



      Usage:
      To execute the tool, use a command line:
        node app.js                                    --> for the standard functionality
        node app.js help                               --> for opening the help file
        node app.js contents=abc.csv                   --> for changing the contents CSV file
        node app.js contents=abc.csv delimiter=","     --> for changing the contents CSV and the delimiter
    `);
    return;
  }

  // check if the file delivering the content is found
  if (!fs.existsSync('./' + cfg.fileContent)) {
    console.log(
      clc.red(
        'File: ./' +
          cfg.fileContent.toString() +
          ' not found.\n\nYou can make use of the contents parameter to change the file location to be used for the file content.\nE.g. node app.js contents=./my_content_file.csv'
      )
    );
    return false;
  }

  // check if the templates directory exists
  if (!fs.existsSync('./' + cfg.dirTemplates)) {
    console.log(
      clc.red(
        'Directory: ./' +
          cfg.dirTemplates.toString() +
          ' not found.\n\nYou can make use of the templates_folder parameter to change the directory to be used for the templates.\nE.g. node app.js template_folder=./my_templates'
      )
    );
    return false;
  }

  // check if output directory exists
  if (!fs.existsSync('./' + cfg.dirOutput)) {
    console.log(
      clc.red(
        'Directory: ./' +
          cfg.dirOutput.toString() +
          ' not found.\n\nYou can make use of the templates_folder parameter to change the directory to be used for the templates.\nE.g. node app.js template_folder=./my_templates'
      )
    );
    return false;
  }
  return true;
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
