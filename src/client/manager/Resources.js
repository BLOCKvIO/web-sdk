export default class Resources {

    constructor(blockv) {
        this.blockv = blockv
    }


    uploadResource(bucketId, prefix, blob, filename) {
        console.log("filename", filename)
        const formData = new FormData();
        formData.append('bucket_id', bucketId);
        formData.append('file', blob, filename);
        formData.append('prefix', prefix);
        return this.blockv.client.request('POST', '/v1/s3/upload', formData, true)
    }
}