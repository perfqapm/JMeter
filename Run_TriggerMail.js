const sendEmail = require('./Run_StartMail');

// Gather the variable values
// const value1 = 'today';
// const value2 = 'tomorrow';


const attachmentPaths = ['/home/runner/work/JMeter/JMeter/apache-jmeter-5.5/bin/jmeter.sh','/home/runner/work/JMeter/JMeter/apache-jmeter-5.5/bin/Aggregate.csv'];

// Call the sendEmail function with the variable values
sendEmail(attachmentPaths);
