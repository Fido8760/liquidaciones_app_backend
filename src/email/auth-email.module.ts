import { Module } from "@nestjs/common";
import { AuthEmail } from "./auth-email.service";
import { EmailModule } from "../email/email.module";

@Module({
  imports: [EmailModule],
  providers: [AuthEmail],
  exports: [AuthEmail]
})
export class AuthEmailModule {}
