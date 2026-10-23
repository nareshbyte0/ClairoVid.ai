import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
let client:S3Client|undefined;
function storage(){const account=process.env.R2_ACCOUNT_ID,access=process.env.R2_ACCESS_KEY_ID,secret=process.env.R2_SECRET_ACCESS_KEY,bucket=process.env.R2_BUCKET;if(!account||!access||!secret||!bucket)throw new Error("Private media storage is not configured.");client??=new S3Client({region:"auto",endpoint:`https://${account}.r2.cloudflarestorage.com`,credentials:{accessKeyId:access,secretAccessKey:secret}});return{client,bucket};}
export async function putPrivateObject(key:string,body:Uint8Array,contentType:string){const s=storage();await s.client.send(new PutObjectCommand({Bucket:s.bucket,Key:key,Body:body,ContentType:contentType,CacheControl:"private, no-store"}));}
export async function getPrivateObjectUrl(key:string){const s=storage();return getSignedUrl(s.client,new GetObjectCommand({Bucket:s.bucket,Key:key}),{expiresIn:900});}
