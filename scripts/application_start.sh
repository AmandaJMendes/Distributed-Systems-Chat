#!/bin/bash

echo 'run application_start.sh: ' >> /home/ec2-user/deploy_logs/deploy.log

echo 'enter folder' >> /home/ec2-user/deploy_logs/deploy.log
cd /home/ec2-user/chat

echo 'stop docker' >> /home/ec2-user/deploy_logs/deploy.log
sudo docker-compose down >> /home/ec2-user/deploy_logs/deploy.log

echo 'restart docker' >> /home/ec2-user/deploy_logs/deploy.log
sudo docker-compose up -d >> /home/ec2-user/deploy_logs/deploy.log

echo 'docker restarted' >> /home/ec2-user/deploy_logs/deploy.log