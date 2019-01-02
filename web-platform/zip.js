const { spawn } = require('child_process');

// var proc = spawn('zip', ['-r', 'all.zip', '.']);
proc.stdout.on('data', d => console.log(d.toString()));
