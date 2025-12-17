import multer from "multer";

let storage = multer.diskStorage({
    destination: function (req ,file ,cb) {
        cb(null, "./public/temp");
    },
    filename: function (req, file, cb) {
        console.log(file);
        let filename = file.originalname + "-" + Date.now();
        cb(null, filename);
    }
})

export let upload = multer({
    storage: storage
})