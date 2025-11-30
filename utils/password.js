import bcryptjs from "bcryptjs";

export function hash(password) {
    return bcryptjs.hashSync(password, 12)
}

export function compare(password, hash) {
    return bcryptjs.compareSync(password, hash);
}