const fs = require('fs');
const path = require('path');

class CustomReporter {
  constructor() {
    this.progressFile = process.env.PROGRESS_PATH 
      ? path.resolve(process.env.PROGRESS_PATH.trim())
      : path.resolve(__dirname, 'progress', 'progress.json');
    
    this.rowId = process.env.ROW_ID;
    if (!this.rowId) {
      throw new Error('ROW_ID is required. Please set it via environment variable.');
    }
  }

  onBegin(config, suite) {
    // เคลียร์ไฟล์ progress.json ก่อนทุกครั้ง
    try {
      fs.writeFileSync(this.progressFile, JSON.stringify({}, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to clear progress file:', err);
    }

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
    let progressData = {};
    if (fs.existsSync(this.progressFile)) {
      try {
        progressData = JSON.parse(fs.readFileSync(this.progressFile, 'utf8'));
      } catch (err) {
        console.error('Failed to parse progress file:', err);
      }
    }

    progressData[this.rowId] = {
      total: this.total,
      completed: this.completed,
      percentage: ((this.completed / this.total) * 100).toFixed(2),
      finished: finished
    };

    fs.writeFileSync(this.progressFile, JSON.stringify(progressData, null, 2), 'utf8');
  }
}

module.exports = CustomReporter;
