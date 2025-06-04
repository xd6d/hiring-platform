import os
import uuid

import boto3

from config.settings import AWS_STORAGE_BUCKET_NAME, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, \
    AWS_S3_ENDPOINT_GET_URL


def upload_file_path(instance, filename):
    extension = os.path.splitext(filename)[1]
    return f"{instance.created_by.pk}/{uuid.uuid4()}{extension}"


def generate_presigned_url(file_path, expires_in=900):
    s3 = boto3.client(
        's3',
        endpoint_url=AWS_S3_ENDPOINT_GET_URL,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY
    )
    return s3.generate_presigned_url(
        'get_object',
        Params={'Bucket': AWS_STORAGE_BUCKET_NAME, 'Key': file_path},
        ExpiresIn=expires_in
    )
