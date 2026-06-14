import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

/*
|--------------------------------------------------------------------------

CLOUDINARY STORAGE CONFIG
*/

const storage = new CloudinaryStorage({
cloudinary,
params: {
folder: 'rumion-novels',
allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
transformation: [
{
width: 600,
height: 900,
crop: 'limit'
}
]
}
});

/*
|--------------------------------------------------------------------------

FILE FILTER (SECURITY LAYER)
*/

const fileFilter = (req, file, cb) => {
const allowedTypes = [
'image/jpeg',
'image/jpg',
'image/png',
'image/webp'
];

if (allowedTypes.includes(file.mimetype)) {
cb(null, true);
} else {
cb(
new Error('Only image files (jpg, png, webp) are allowed'),
false
);
}
};

/*
|--------------------------------------------------------------------------

MULTER CONFIG
*/

const upload = multer({
storage,
fileFilter,
limits: {
fileSize: 5 * 1024 * 1024 // 5MB max
}
});

export { upload };
