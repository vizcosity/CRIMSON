FROM jjanzic/docker-python3-opencv:latest

ADD /.temp_creds/google-cloud-compute-engine-key.json /opt/.google-cloud/google-cloud-compute-engine-key.json

ENV GOOGLE_APPLICATION_CREDENTIALS=/opt/.google-cloud/google-cloud-compute-engine-key.json

ADD detection/ /opt/detection

WORKDIR /opt/detection/src

RUN pip3 install -r requirements.txt