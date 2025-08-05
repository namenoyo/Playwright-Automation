const fs = require('fs');
const path = require('path');

class CustomReporter {
  constructor() {
    // รับ path จาก environment variable (ตั้งจาก command)
    this.progressFile = process.env.PROGRESS_PATH 
      ? path.resolve(process.env.PROGRESS_PATH) 
      : path.resolve(__dirname, 'progress.json');
  }

  onBegin(config, suite) {
    this.total = suite.allTests().length;
    this.completed = 0;
    this._writeProgress();
  }

  onTestEnd(test, result) {
    this.completed++;
    this._writeProgress();
  }

  onEnd() {
    this._writeProgress(true);
  }

  _writeProgress(finished = false) {
    const data = {
      total: this.total,
      completed: this.completed,
      percentage: ((this.completed / this.total) * 100).toFixed(2),
      finished
    };
    fs.writeFileSync(this.progressFile, JSON.stringify(data, null, 2));
  }
}

module.exports = CustomReporter;
