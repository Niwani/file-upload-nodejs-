var http = require('http');
var formidable = require('formidable');
var fs = require('fs');
var path = require('path');
var nodemailer = require('nodemailer');
var EventEmitter = require('events');

// Create an instance of EventEmitter
var eventEmitter = new EventEmitter();

// Custom event that logs when a file is uploaded
eventEmitter.on('fileUploaded', function(fileName, userEmail) {
  console.log('A new file was uploaded: ' + fileName);
  sendEmail(userEmail, fileName);
});

// Create reusable transporter object using the default SMTP transport
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'eniolaadio60@gmail.com',  // Your email
    pass: '********'      // Your email password
  }
});

// Function to send the email
function sendEmail(userEmail, fileName) {
  var mailOptions = {
    from: 'eniolaadio60@gmail.com',
    to: userEmail,
    subject: 'File Upload Confirmation',
    text: `Hello! Your file ${fileName} has been uploaded successfully.`
  };

  transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}

// Create an HTTP server
http.createServer(function(req, res) {
  if (req.url === '/fileupload' && req.method.toLowerCase() === 'post') {
    var form = new formidable.IncomingForm();

    
    form.parse(req, function(err, fields, files) {
      
      if (err) {
        console.error('Error parsing the form:', err);
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Error: Invalid form data.');
        return;
      }


      // Check if the file is present and not an array
      if (!files.filetoupload || !files.filetoupload[0] || !files.filetoupload[0].originalFilename) {
        console.log('No valid file uploaded.');
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Error: No valid file uploaded. Please try again.');
        return;
      }

      // Get the first file
      var uploadedFile = files.filetoupload[0];
      var oldPath = uploadedFile.filepath; 
      var fileName = uploadedFile.originalFilename; 
      var newPath = path.join(__dirname, 'uploads', fileName); 
      var userEmail = fields.userEmail[0]; 

      // Move the file to the desired directory
      fs.rename(oldPath, newPath, function(err) {
        if (err) {
          console.error('Error saving file:', err);
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Error saving file.');
          return;
        }

        // Emit the custom event after the file is uploaded
        eventEmitter.emit('fileUploaded', fileName, userEmail);

        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(`File uploaded and saved successfully! A confirmation email has been sent to ${userEmail}.`);
      });
    });
  } else {
    // Serve the HTML form for file upload and email input
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write(`
      <html>
        <body>
          <h2>File Upload</h2>
          <form action="/fileupload" method="post" enctype="multipart/form-data">
            <input type="email" name="userEmail" placeholder="Enter your email" required><br><br>
            <input type="file" name="filetoupload" required><br><br>
            <input type="submit" value="Upload">
          </form>
        </body>
      </html>
    `);
    return res.end();
  }
}).listen(3000, function() {
  console.log('Server is running on http://localhost:3000');
});
