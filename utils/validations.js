import Joi from "joi";

export const userSchema = Joi.object({
    email: Joi.string()
    .email()
        .min(3)
        .max(30)
        .required(),

    password: Joi.string()
        .min(8)
        .pattern(
          new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*]).*$")
        )
        .required() })
        