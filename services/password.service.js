import bcryptjs from "bcryptjs";

export class PasswordService {
    async hash(password) {
        return await bcryptjs.hashSync(password, 10);
    }

    async compare(password, hashedPassword) {
        return await bcryptjs.compareSync(password, hashedPassword);
    }
}