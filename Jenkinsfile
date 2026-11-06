pipeline {
  agent any   // agent needs Docker, Node.js and Chrome installed
  stages {
    stage('Install') { steps { sh 'npm install' } }
    stage('Build Image') { steps { sh 'docker build -t event-system .' } }
    stage('Run Container') {
      steps {
        sh 'docker rm -f event-app || true'
        sh 'docker run -d --name event-app -p 3000:3000 event-system'
        sh 'sleep 5'
      }
    }
    stage('Selenium Tests') { steps { sh 'BASE_URL=http://localhost:3000 npm test' } }
  }
  post { always { sh 'docker rm -f event-app || true' } }
}
