pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'your-registry.com' // Change to your registry
        IMAGE_NAME = 'saas-backend'
        IMAGE_TAG = "${env.BUILD_NUMBER}"
        DOCKER_CREDENTIALS_ID = 'docker-registry-credentials'
        KUBECONFIG_CREDENTIALS_ID = 'kubeconfig-credentials'
        NAMESPACE = 'production'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_COMMIT_SHORT = sh(
                        script: "git rev-parse --short HEAD",
                        returnStdout: true
                    ).trim()
                }
            }
        }
        
        stage('Install Dependencies') {
            steps {
                dir('PI-DEV-BACKEND') {
                    sh 'npm ci'
                }
            }
        }
        
        stage('Lint') {
            steps {
                dir('PI-DEV-BACKEND') {
                    sh 'npm run lint || true'
                }
            }
        }
        
        stage('Build') {
            steps {
                dir('PI-DEV-BACKEND') {
                    sh 'npm run build'
                }
            }
        }
        
        stage('Test') {
            steps {
                dir('PI-DEV-BACKEND') {
                    sh 'npm run test || true'
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                dir('PI-DEV-BACKEND') {
                    script {
                        docker.build("${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}")
                        docker.build("${DOCKER_REGISTRY}/${IMAGE_NAME}:latest")
                    }
                }
            }
        }
        
        stage('Push Docker Image') {
            steps {
                script {
                    docker.withRegistry("https://${DOCKER_REGISTRY}", DOCKER_CREDENTIALS_ID) {
                        docker.image("${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}").push()
                        docker.image("${DOCKER_REGISTRY}/${IMAGE_NAME}:latest").push()
                    }
                }
            }
        }
        
        stage('Deploy to Kubernetes') {
            steps {
                script {
                    withCredentials([file(credentialsId: KUBECONFIG_CREDENTIALS_ID, variable: 'KUBECONFIG')]) {
                        dir('PI-DEV-BACKEND/k8s') {
                            sh """
                                kubectl --kubeconfig=\$KUBECONFIG apply -f configmap.yaml -n ${NAMESPACE}
                                kubectl --kubeconfig=\$KUBECONFIG apply -f secret.yaml -n ${NAMESPACE}
                                kubectl --kubeconfig=\$KUBECONFIG apply -f service.yaml -n ${NAMESPACE}
                                kubectl --kubeconfig=\$KUBECONFIG set image deployment/backend backend=${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG} -n ${NAMESPACE}
                                kubectl --kubeconfig=\$KUBECONFIG apply -f deployment.yaml -n ${NAMESPACE}
                                kubectl --kubeconfig=\$KUBECONFIG rollout status deployment/backend -n ${NAMESPACE} --timeout=5m
                            """
                        }
                    }
                }
            }
        }
        
        stage('Verify Deployment') {
            steps {
                script {
                    withCredentials([file(credentialsId: KUBECONFIG_CREDENTIALS_ID, variable: 'KUBECONFIG')]) {
                        sh """
                            kubectl --kubeconfig=\$KUBECONFIG get pods -n ${NAMESPACE} -l app=backend
                            kubectl --kubeconfig=\$KUBECONFIG get svc -n ${NAMESPACE} backend
                        """
                    }
                }
            }
        }
    }
    
    post {
        success {
            echo 'Backend deployment successful!'
            // Add notification here (Slack, email, etc.)
        }
        failure {
            echo 'Backend deployment failed!'
            // Add notification here
        }
        always {
            cleanWs()
        }
    }
}
