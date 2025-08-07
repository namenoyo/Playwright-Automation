const fs = require('fs');
const path = require('path');

class CustomReporter {
  constructor() {
    // รับ path จาก environment variable (ตั้งจาก command)
   this.progressFile = process.env.PROGRESS_PATH 
  ? path.resolve(process.env.PROGRESS_PATH.trim())  // ตัดช่องว่าง
  : path.resolve(__dirname, 'progress', 'progress.json');

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
  const text = `total=${this.total}\ncompleted=${this.completed}\npercentage=${((this.completed / this.total) * 100).toFixed(2)}\nfinished=${finished}`;
  fs.writeFileSync(this.progressFile, text, 'utf8');
}

}

module.exports = CustomReporter;
