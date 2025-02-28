const { exec } = require('child_process'); // For running shell commands
const { NodeSSH } = require('node-ssh');
const { promises: { readFile, writeFile, unlink } } = require("fs");
const path = require('path');
const ssh = new NodeSSH();
const AdmZip = require('adm-zip');

// Step 1: Build the Vite project
async function deploy() {
  try {
    const config = {
      host: '135.181.151.155',
      port: '7342',
      username: 'roma',
      privateKey: 'E:/Archive/hetzner/openssh', // Use SSH key authentication
    };
    // Path to deploy on VPS
    
    const remoteDistPath = '/home/roma/www/buckitupss/api/src';
    const pm2ProcessName = 'buckitupss_api_3950'; // Replace with your actual PM2 process name or ID
    
    console.log('Starting file upload...');
   
	  config.privateKey = await readFile(config.privateKey, 'utf-8')

    // Step 3: Connect to VPS via SSH
    await ssh.connect(config);
    console.log('Connected to the VPS. Uploading files...');

    // Step 4: Remove all files in the destination folder on the VPS
    const removeCommand = `rm -rf ${remoteDistPath}/*`;
    const removeResult = await ssh.execCommand(removeCommand);
    if (removeResult.stderr) {
      throw new Error(`Error cleaning remote directory: ${removeResult.stderr}`);
    }
    console.log('Remote directory cleaned successfully.');

    // Step 3: Zip the dist directory
    const localDistPath = path.join(__dirname, 'src');
    const zipPath = path.join(__dirname, 'src.zip');
    
    console.log('Zipping dist directory...');
    const zip = new AdmZip();
    zip.addLocalFolder(localDistPath);
    zip.writeZip(zipPath);
    console.log('Dist folder zipped successfully!');


    // Step 5: Upload the zip file
    const remoteZipPath = `${remoteDistPath}/src.zip`;
    await ssh.putFile(zipPath, remoteZipPath);
    console.log('Zip file uploaded successfully!');

    // Step 6: Unzip the file on the server
    console.log('Unzipping file on the server...');
    await ssh.execCommand(`unzip -o ${remoteZipPath} -d ${remoteDistPath}`);
    console.log('Files unzipped successfully on the server!');

    // Step 7: Clean up by removing the zip file from the server
    await ssh.execCommand(`rm -f ${remoteZipPath}`);
    console.log('Remote zip file deleted successfully!');

    // Step 8: Clean up the local zip file
    await unlink(zipPath);
    console.log('Local zip file deleted successfully!');

    // Step 8: Restart the PM2 process using SSH
    const result = await ssh.execCommand(`. ~/.nvm/nvm.sh && pm2 restart ${pm2ProcessName}`);
    if (result.stderr) {
      console.error(`Error restarting PM2 process! ${result.stderr} / pm2 restart ${pm2ProcessName}`);
    } else {
      console.log('PM2 process restarted successfully:', result.stdout);
    }

    //const result2 = await ssh.execCommand('echo $PATH');
    //console.log('PATH:', result2.stdout);

    // Step 9: Close the SSH connection
    ssh.dispose();
    console.log('SSH connection closed.');
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

deploy()
