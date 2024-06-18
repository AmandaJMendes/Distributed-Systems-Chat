#!/bin/bash

echo 'run application_start.sh: ' >> /home/ec2-user/deploy_logs/deploy.log

echo 'stop docker' >> /home/ec2-user/deploy_logs/deploy.log
sudo docker-compose down >> /home/ec2-user/deploy_logs/deploy.log

echo 'restart docker' >> /home/ec2-user/deploy_logs/deploy.log
sudo docker-compose up -d >> /home/ec2-user/deploy_logs/deploy.log