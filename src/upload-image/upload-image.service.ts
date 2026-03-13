import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryResponse } from './upload-image.response';

const streamifier = require('streamifier')

@Injectable()
export class UploadImageService {
    async uploadFile(file : Express.Multer.File) : Promise<CloudinaryResponse> {
        return new Promise<CloudinaryResponse>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: 'auto',
                    folder: 'evidencias'
                },
                (error, result) => {
                    if (error) return reject(new Error(`Error uploading file to Cloudinary: ${error.message}`));
                    if (!result) return reject(new Error('No result returned from Cloudinary'));
                    resolve(result);
                }
            )

            streamifier.createReadStream(file.buffer).pipe(uploadStream)
        })
    }

    async deleteFile(publicId: string) {
        return cloudinary.uploader.destroy(publicId, {
            resource_type: 'image'
        });
    }
}
