using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SIGETIC.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RotateInitialUserPasswords : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "usuarios",
                keyColumn: "id",
                keyValue: new Guid("99999999-9999-9999-9999-999999999901"),
                column: "password_hash",
                value: "PBKDF2$100000$U0lHRVRJQy1TRUVELTEyMw==$i1+AHOAmtLD32rOHnRdrVxH3XvFNTiAnBIOfrXk6aDc=");

            migrationBuilder.UpdateData(
                table: "usuarios",
                keyColumn: "id",
                keyValue: new Guid("99999999-9999-9999-9999-999999999902"),
                column: "password_hash",
                value: "PBKDF2$100000$U0lHRVRJQy1TRUVELTEyMw==$KhPXRkL0wtv+wc3FCc0wToQSYLxy2UgpWh3bhfFOJNk=");

            migrationBuilder.UpdateData(
                table: "usuarios",
                keyColumn: "id",
                keyValue: new Guid("99999999-9999-9999-9999-999999999903"),
                column: "password_hash",
                value: "PBKDF2$100000$U0lHRVRJQy1TRUVELTEyMw==$4aCPuTJlP/3ueUt3g/rNa54vbAj9p8b05xhGsUHw5Uw=");

            migrationBuilder.UpdateData(
                table: "usuarios",
                keyColumn: "id",
                keyValue: new Guid("99999999-9999-9999-9999-999999999999"),
                column: "password_hash",
                value: "PBKDF2$100000$U0lHRVRJQy1TRUVELTEyMw==$lSmKzh6GuxzgqXW1/AaCDXUBki5UtsLLy4RB3VaXeJU=");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "usuarios",
                keyColumn: "id",
                keyValue: new Guid("99999999-9999-9999-9999-999999999901"),
                column: "password_hash",
                value: "PBKDF2$100000$U0lHRVRJQy1TRUVELTEyMw==$CcD5E2RqWu4gVWIrvU4M+JPC/m9tMGOmLLZLcf8aHRc=");

            migrationBuilder.UpdateData(
                table: "usuarios",
                keyColumn: "id",
                keyValue: new Guid("99999999-9999-9999-9999-999999999902"),
                column: "password_hash",
                value: "PBKDF2$100000$U0lHRVRJQy1TRUVELTEyMw==$CcD5E2RqWu4gVWIrvU4M+JPC/m9tMGOmLLZLcf8aHRc=");

            migrationBuilder.UpdateData(
                table: "usuarios",
                keyColumn: "id",
                keyValue: new Guid("99999999-9999-9999-9999-999999999903"),
                column: "password_hash",
                value: "PBKDF2$100000$U0lHRVRJQy1TRUVELTEyMw==$CcD5E2RqWu4gVWIrvU4M+JPC/m9tMGOmLLZLcf8aHRc=");

            migrationBuilder.UpdateData(
                table: "usuarios",
                keyColumn: "id",
                keyValue: new Guid("99999999-9999-9999-9999-999999999999"),
                column: "password_hash",
                value: "PBKDF2$100000$U0lHRVRJQy1TRUVELTEyMw==$oVgabe+uhoKIpI5ySW5DiJV57uFA33l7lzdffPwU30A=");
        }
    }
}
