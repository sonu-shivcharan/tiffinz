import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import {
  loginWithEmailSchema,
  loginWithPhoneSchema,
  loginWithUsernameSchema,
  ILoginCredentials,
} from "@/zod/user.login.schema";

import { loginUser, createUserSession } from "@/helpers/server/user.auth";
// type LoginOption = {
//   key: keyof ILoginCredentials;
//   schema:
//     | typeof loginWithEmailSchema
//     | typeof loginWithPhoneSchema
//     | typeof loginWithUsernameSchema;
// };

// const loginOptions: LoginOption[] = [
//   { key: "email", schema: loginWithEmailSchema },
//   { key: "username", schema: loginWithUsernameSchema },
//   { key: "phone", schema: loginWithPhoneSchema },
// ];

export const POST = asyncHandler(
  async (req) => {
    const body: ILoginCredentials = await req.json();
    type LoginKey = "email" | "username" | "phone";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const loginOptions: { key: LoginKey; schema: any }[] = [
      { key: "email", schema: loginWithEmailSchema },
      { key: "username", schema: loginWithUsernameSchema },
      { key: "phone", schema: loginWithPhoneSchema },
    ];
    let validatedData: {
      key: LoginKey;
      value: string;
      password: string;
    } | null = null;

    for (const option of loginOptions) {
      if (option.key in body) {
        const parsed = option.schema.safeParse(body);
        if (!parsed.success) {
          return ApiResponse.zodError(parsed.error);
        }
        const { password } = parsed.data;
        validatedData = {
          key: option.key,
          value: parsed.data[option.key],
          password,
        };
        break;
      }
    }
    if (!validatedData) {
      return ApiResponse.error("No valid login identifier provided", 400);
    }
    console.log("validatedData", validatedData);

    const loginResult = await loginUser(
      validatedData.key,
      validatedData.value,
      validatedData.password,
    );

    const { user } = loginResult;

    return await createUserSession(user?._id);
  },
  {
    rateLimiter: {
      maxReq: 4,
      timeout: 60,
    },
  },
);
