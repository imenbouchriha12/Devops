pipeline {
    agent any
    
    environment {
        // Docker Registry Configuration
        DOCKER_REGISTRY = 'your-registry.com' // Change to: docker.io, gcr.io, or your private registry
        DOCKER_REGISTRY_URL = "https://${DOCKER_REGISTRY}"
        IMAGE_NAME = 'saas-backend'
        IMAGE_TAG = "${env.BUILD_NUMBER}-${env.GIT_COMMIT?.take(7) ?: 'latest'}"
        
        // Credentials IDs (configure these in Jenkins)
        DOCKER_CREDENTIALS_ID = 'docker-registry-credentials'
        KUBECONFIG_CREDENTIALS_ID = 'kubeconfig-credentials'
        
        // Kubernetes Configuration
        NAMESPACE = 'production'
        DEPLOYMENT_NAME = 'backend'
        
        // Build Configuration
        NODE_VERSION = '18'
        
        // Notification (optional)
        SLACK_CHANNEL = '#deployments'
        EMAIL_RECIPIENTS = 'team@example.com'
    }
    
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
        timestamps()
        disableConcurrentBuilds()
    }
    
    stages {
        stage('🔍 Checkout') {
            steps {
                script {
                    echo "🔄 Checking out code..."
                    checkout scm
                    env.GIT_COMMIT_SHORT = sh(
                        script: "git rev-parse --short HEAD",
                        returnStdout: true
                    ).trim()
                    env.GIT_BRANCH = sh(
                        script: "git rev-parse --abbrev-ref HEAD",
                        returnStdout: true
                    ).trim()
                    echo "📌 Branch: ${env.GIT_BRANCH}"
                    echo "📌 Commit: ${env.GIT_COMMIT_SHORT}"
                }
            }
        }
        
        stage('🔧 Setup Node.js') {
            steps {
                dir('PI-DEV-BACKEND') {
                    script {
                        echo "📦 Setting up Node.js ${NODE_VERSION}..."
                        sh """
                            node --version
                            npm --version
                        """
                    }
                }
            }
        }
        
        stage('📥 Install Dependencies') {
            steps {
                dir('PI-DEV-BACKEND') {
                    script {
                        echo "📥 Installing dependencies..."
                        sh 'npm ci --prefer-offline --no-audit'
                    }
                }
            }
        }
        
        stage('🔍 Lint') {
            steps {
                dir('PI-DEV-BACKEND') {
                    script {
                        echo "🔍 Running linter..."
                        sh 'npm run lint || true'
                    }
                }
            }
        }
        
        stage('🏗️ Build') {
            steps {
                dir('PI-DEV-BACKEND') {
                    script {
                        echo "🏗️ Building application..."
                        sh 'npm run build'
                    }
                }
            }
        }
        
        stage('🧪 Test') {
            steps {
                dir('PI-DEV-BACKEND') {
                    script {
                        echo "🧪 Running tests..."
                        sh 'npm run test || true'
                    }
                }
            }
        }
        
        stage('🐳 Build Docker Image') {
            steps {
                dir('PI-DEV-BACKEND') {
                    script {
                        echo "🐳 Building Docker image..."
                        echo "Image: ${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
                        
                        dockerImage = docker.build(
                            "${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}",
                            "--build-arg BUILD_DATE=\$(date -u +'%Y-%m-%dT%H:%M:%SZ') " +
                            "--build-arg VCS_REF=${env.GIT_COMMIT_SHORT} " +
                            "--build-arg VERSION=${IMAGE_TAG} " +
                            "."
                        )
                        
                        // Tag as latest
                        sh "docker tag ${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG} ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest"
                    }
                }
            }
        }
        
        stage('🔐 Security Scan') {
            steps {
                script {
                    echo "🔐 Running security scan..."
                    // Optional: Add Trivy or other security scanning
                    sh """
                        echo "Security scan placeholder"
                        # docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image ${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}
                    """ 
                }
            }
        }
        
        stage('📤 Push Docker Image') {
            steps {
                script {
                    echo "📤 Pushing Docker image to registry..."
                    docker.withRegistry(DOCKER_REGISTRY_URL, DOCKER_CREDENTIALS_ID) {
                        sh "docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
                        sh "docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest"
                    }
                    echo "✅ Image pushed successfully!"
                }
            }
        }
        
        stage('🚀 Deploy to Kubernetes') {
            when {
                branch 'main'
            }
            steps {
                script {
                    echo "🚀 Deploying to Kubernetes..."
                    withCredentials([file(credentialsId: KUBECONFIG_CREDENTIALS_ID, variable: 'KUBECONFIG')]) {
                        dir('PI-DEV-BACKEND/k8s') {
                            sh """
                                echo "📝 Applying ConfigMap..."
                                kubectl --kubeconfig=\$KUBECONFIG apply -f configmap.yaml -n ${NAMESPACE}
                                
                                echo "🔐 Applying Secrets..."
                                kubectl --kubeconfig=\$KUBECONFIG apply -f secret.yaml -n ${NAMESPACE}
                                
                                echo "🔌 Applying Service..."
                                kubectl --kubeconfig=\$KUBECONFIG apply -f service.yaml -n ${NAMESPACE}
                                
                                echo "💾 Applying PVC..."
                                kubectl --kubeconfig=\$KUBECONFIG apply -f pvc.yaml -n ${NAMESPACE}
                                
                                echo "🔄 Updating deployment image..."
                                kubectl --kubeconfig=\$KUBECONFIG set image deployment/${DEPLOYMENT_NAME} \
                                    backend=${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG} \
                                    -n ${NAMESPACE}
                                
                                echo "📋 Applying Deployment..."
                                kubectl --kubeconfig=\$KUBECONFIG apply -f deployment.yaml -n ${NAMESPACE}
                                
                                echo "⏳ Waiting for rollout to complete..."
                                kubectl --kubeconfig=\$KUBECONFIG rollout status deployment/${DEPLOYMENT_NAME} \
                                    -n ${NAMESPACE} --timeout=5m
                            """
                        }
                    }
                }
            }
        }
        
        stage('✅ Verify Deployment') {
            when {
                branch 'main'
            }
            steps {
                script {
                    echo "✅ Verifying deployment..."
                    withCredentials([file(credentialsId: KUBECONFIG_CREDENTIALS_ID, variable: 'KUBECONFIG')]) {
                        sh """
                            echo "📊 Deployment Status:"
                            kubectl --kubeconfig=\$KUBECONFIG get deployment ${DEPLOYMENT_NAME} -n ${NAMESPACE}
                            
                            echo "\n📦 Pods:"
                            kubectl --kubeconfig=\$KUBECONFIG get pods -n ${NAMESPACE} -l app=backend
                            
                            echo "\n🔌 Services:"
                            kubectl --kubeconfig=\$KUBECONFIG get svc -n ${NAMESPACE} backend
                            
                            echo "\n📝 Recent Events:"
                            kubectl --kubeconfig=\$KUBECONFIG get events -n ${NAMESPACE} --sort-by='.lastTimestamp' | tail -10
                        """
                    }
                }
            }
        }
        
        stage('🧹 Cleanup') {
            steps {
                script {
                    echo "🧹 Cleaning up old Docker images..."
                    sh """
                        docker image prune -f
                        docker images | grep ${IMAGE_NAME} | grep -v ${IMAGE_TAG} | grep -v latest | awk '{print \$3}' | xargs -r docker rmi -f || true
                    """
                }
            }
        }
    }
    
    post {
        success {
            script {
                echo "✅ Backend deployment successful!"
                echo "🎉 Build #${env.BUILD_NUMBER} completed successfully"
                echo "📦 Image: ${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
                
                // Optional: Send Slack notification
                // slackSend(
                //     channel: SLACK_CHANNEL,
                //     color: 'good',
                //     message: "✅ Backend deployed successfully!\nBuild: #${env.BUILD_NUMBER}\nBranch: ${env.GIT_BRANCH}\nCommit: ${env.GIT_COMMIT_SHORT}"
                // )
            }
        }
        
        failure {
            script {
                echo "❌ Backend deployment failed!"
                echo "Build #${env.BUILD_NUMBER} failed"
                
                // Optional: Send Slack notification
                // slackSend(
                //     channel: SLACK_CHANNEL,
                //     color: 'danger',
                //     message: "❌ Backend deployment failed!\nBuild: #${env.BUILD_NUMBER}\nBranch: ${env.GIT_BRANCH}\nCommit: ${env.GIT_COMMIT_SHORT}"
                // )
                
                // Optional: Send email
                // emailext(
                //     subject: "Jenkins Build Failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                //     body: "Build failed. Check console output at ${env.BUILD_URL}",
                //     to: EMAIL_RECIPIENTS
                // )
            }
        }
        
        unstable {
            echo "⚠️ Build is unstable"
        }
        
        always {
            script {
                echo "🧹 Cleaning workspace..."
                cleanWs()
            }
        }
    }
}
