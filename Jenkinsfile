pipeline {
  agent any   // Windows agent needs Docker, Node.js and Chrome installed
  stages {
    stage('Install') { steps { bat 'npm install' } }
    stage('Build Image') { steps { bat 'docker build -t event-system .' } }
    stage('Run Container') {
      steps {
        bat 'docker rm -f event-app >nul 2>&1 || exit /b 0'
        bat 'docker run -d --name event-app -p 3000:3000 event-system'
        bat 'powershell -NoProfile -NonInteractive -Command "Start-Sleep -Seconds 5"'
      }
    }
    stage('Selenium Tests') {
      steps {
        bat 'set "BASE_URL=http://localhost:3000" && npm test'
      }
    }
  }
  post {
    always {
      bat 'docker rm -f event-app >nul 2>&1 || exit /b 0'
    }
  }
}
