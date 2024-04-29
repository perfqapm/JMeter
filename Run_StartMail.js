const fs = require('fs');
const csv = require('csv-parser');
const nodemailer = require('nodemailer');
const moment = require('moment-timezone');
const yargs = require('yargs');

let params = yargs.argv;

let emailAddress;
let gmailPassword;

try {
  console.log(process.argv);

  // if more than one email ids are there, split
  let temp = params.emails.replace(' ', '');
  if (temp.includes(',')) {
    emailAddress = temp.split(',');
  } else {
    emailAddress = temp;
  }

  console.log('Email Ids: ' + emailAddress);

} catch (error) {
  console.log('Error reading the git action variables:' + error.message);
}

function getColorForElapsed(elapsed) {
  if (elapsed < 1000) {
    return 'green'; // Less than 1 second (1000 milliseconds)
  } else if (elapsed >= 1000 && elapsed < 3000) {
    return 'orange'; // Between 1 to 3 seconds (1000 to 3000 milliseconds)
  } else {
    return 'red'; // Above 3 seconds (3000 milliseconds)
  }
}

function sendEmail(attachmentPaths) {
  try {
    // Set your desired timezone
    const timezone = 'Asia/Kolkata';

    // Get the current time in the specified timezone
    const timestamp = moment().tz(timezone).format('MMMM Do YYYY, h:mm a');

    const transporter = nodemailer.createTransport({
      service: 'gmail', // e.g., 'Gmail'
      auth: {
        user: 'ramsnotification@gmail.com',
        pass: 'uwyvhdauoxuabayb',
      },
    });

    // Read the CSV file and sort by the 'elapsed' column
    const csvData = [];
    fs.createReadStream('/home/runner/work/JMeter/JMeter/apache-jmeter-5.5/bin/Aggregate.csv')
      .pipe(csv())
      .on('data', (row) => {
        csvData.push(row);
      })
      .on('end', () => {
        csvData.sort((a, b) => b.elapsed - a.elapsed); // Sort in descending order by 'elapsed'

        // Calculate the count of unique errors (unique labels where 'success' is false)
        const errorLabels = new Set();
        csvData.forEach((row) => {
          if (row.success === 'false') {
            errorLabels.add(row.label);
          }
        });

        const errorRowCount = errorLabels.size;

        // Construct an HTML table for the "Top 10 errors" with inline CSS styles for styling
        const errorRows = [];
        const top10ErrorLabels = new Set(); // Track unique labels for top 10 errors

        for (const row of csvData) {
          if (row.success === 'false' && !top10ErrorLabels.has(row.label)) {
            top10ErrorLabels.add(row.label);
            errorRows.push(row);

            if (errorRows.length >= 10) {
              break; // Stop when 10 unique errors are found
            }
          }
        }

        const tableHeaderStyle = 'background-color: #d0d0d0; color: darkblue;';
        const tableBodyStyle = 'background-color: #e0e0e0; color: darkblue;';

        const errorTableRows = errorRows.map((row) => {
          return `
            <tr>
              <td style="${tableBodyStyle}">${row.label}</td>
              <td style="${tableBodyStyle}"><a href="${row.URL}">${row.URL}</a></td>
              <td style="${tableBodyStyle}">${row.responseCode}</td>
              <td style="${tableBodyStyle}">${row.success}</td>
              <td style="${tableBodyStyle}">${row.elapsed}</td>
              <td style="${tableBodyStyle}">${row.responseMessage}</td>
              <td style="${tableBodyStyle}">${row.failureMessage}</td>
            </tr>`;
        });

        const errorHtmlTable = `
          <h3>Top 10 errors:</h3>
          <table border="1" style="border-collapse: collapse;">
            <thead>
              <tr>
                <th style="${tableHeaderStyle}">label</th>
                <th style="${tableHeaderStyle}">URL</th>
                <th style="${tableHeaderStyle}">responseCode</th>
                <th style="${tableHeaderStyle}">success</th>
                <th style="${tableHeaderStyle}">elapsed</th>
                <th style="${tableHeaderStyle}">responseMessage</th>
                <th style="${tableHeaderStyle}">failureMessage</th>
              </tr>
            </thead>
            <tbody>
              ${errorTableRows.join('')}
            </tbody>
          </table>
        `;

        // Take only the top 10 rows from the sorted CSV data for the "Top 10 response times" table
        const top10Rows = csvData.slice(0, 10);

        // Construct an HTML table from the top 10 rows of the CSV data for the "Top 10 response times" table
        const tableRows = top10Rows.map((row) => {
          const elapsedColor = getColorForElapsed(parseInt(row.elapsed));
          return `
            <tr>
              <td style="${tableBodyStyle}">${row.label}</td>
              <td style="${tableBodyStyle}"><a href="${row.URL}">${row.URL}</a></td>
              <td style="${tableBodyStyle}">${row.responseCode}</td>
              <td style="${tableBodyStyle}">${row.success}</td>
              <td style="${tableBodyStyle} color: ${elapsedColor};">${row.elapsed}</td>
              <td style="${tableBodyStyle}">${row.responseMessage}</td>
              <td style="${tableBodyStyle}">${row.failureMessage}</td>
            </tr>`;
        });

        const htmlTable = `
          <h3>Top 10 response times:</h3>
          <table border="1" style="border-collapse: collapse;">
            <thead>
              <tr>
                <th style="${tableHeaderStyle}">label</th>
                <th style="${tableHeaderStyle}">URL</th>
                <th style="${tableHeaderStyle}">responseCode</th>
                <th style="${tableHeaderStyle}">success</th>
                <th style="${tableHeaderStyle}">elapsed</th>
                <th style="${tableHeaderStyle}">responseMessage</th>
                <th style="${tableHeaderStyle}">failureMessage</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows.join('')}
            </tbody>
          </table>
        `;

        const mailOptions = {
          from: 'ramsnotification@gmail.com',
          to: emailAddress,
          subject: '[API/WebServices Monitoring Solution] Run Status ! ' + timestamp,
          html: `<html><body><h2>API/WebServices Monitoring Solution Run Details :</h2><h3>Number of Errors: ${errorRowCount}</h3>${errorHtmlTable}${htmlTable}</body></html>`,
          attachments: attachmentPaths.map((path) => ({ path })),
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error('Error sending email:', error);
          } else {
            console.log('Email sent:', info.response);
          }
        });
      });
  } catch (error) {
    console.error('Error:', error);
  }
}

module.exports = sendEmail;
