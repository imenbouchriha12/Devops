pipeline {
    agent any

    tools {
        nodejs 'Node18'   // ✅ FIX: This was missing — caused exit code 127
    }

    environment {
        // ✅ Docker Hub config
        DOCKER_REGISTRY = 'bardaoui'
        DOCKER_REGISTRY_URL = 'https://index.docker.io/v1/'
        IMAGE_NAME = 'backend'
        IMAGE_TAG = "${BUILD_NUMBER}"   // ✅ FIX: was env.BUILD_NUMBER

        // ✅ Credentials
        DOCKER_CREDENTIALS_ID = 'docker-hub-credentials'
        KUBECONFIG_CREDENTIALS_ID = 'kubeconfig-credentials'

        // ✅ Kubernetes
        NAMESPACE = 'default'
        DEPLOYMENT_NAME = 'backend'
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
        timestamps()
    }

    stages {

        stage('🔍 Checkout') {
            steps {
                checkout scm
            }
        }

        stage('📥 Install Dependencies') {
            steps {
                sh 'node -v && npm -v'   // ✅ FIX: verify node is available before running
                sh 'npm ci'
            }
        }

        stage('🏗️ Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('🐳 Build Docker Image') {
            steps {
                script {
                    dockerImage = docker.build("${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}")
                    sh "docker tag ${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG} ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest"
                }
            }
        }

        stage('📤 Push Docker Image') {
            steps {
                script {
                    docker.withRegistry(DOCKER_REGISTRY_URL, DOCKER_CREDENTIALS_ID) {
                        sh "docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
                        sh "docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest"
                    }
                }
            }
        }

        stage('🚀 Deploy to Kubernetes') {
            steps {
                script {
                    withCredentials([file(credentialsId: KUBECONFIG_CREDENTIALS_ID, variable: 'KUBECONFIG')]) {
                        dir('k8s') {
                            sh """
                                kubectl --kubeconfig=\$KUBECONFIG apply -f configmap.yaml -n ${NAMESPACE} || true
                                kubectl --kubeconfig=\$KUBECONFIG apply -f secret.yaml -n ${NAMESPACE} || true
                                kubectl --kubeconfig=\$KUBECONFIG apply -f service.yaml -n ${NAMESPACE}

                                kubectl --kubeconfig=\$KUBECONFIG apply -f deployment.yaml -n ${NAMESPACE}

                                kubectl --kubeconfig=\$KUBECONFIG set image deployment/${DEPLOYMENT_NAME} backend=${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG} -n ${NAMESPACE}

                                kubectl --kubeconfig=\$KUBECONFIG rollout status deployment/${DEPLOYMENT_NAME} -n ${NAMESPACE}
                            """
                        }
                    }
                }
            }
        }

        stage('✅ Verify') {
            steps {
                script {
                    withCredentials([file(credentialsId: KUBECONFIG_CREDENTIALS_ID, variable: 'KUBECONFIG')]) {
                        sh "kubectl --kubeconfig=\$KUBECONFIG get pods -n ${NAMESPACE}"
                    }
                }
            }
        }
    }

    post {
        success {
            echo "✅ SUCCESS: Backend deployed!"
        }
        failure {
            echo "❌ ERROR: Deployment failed!"
        }
        always {
            cleanWs()
        }
    }
}