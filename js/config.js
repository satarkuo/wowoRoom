const baseUrl = "https://livejs-api.hexschool.io";
const apiPath = "satarkuo";

//前台
const customerApi = `${baseUrl}/api/livejs/v1/customer/${apiPath}`;

//後台
const token = "kctSoXmsBHZlcIclHtESFYPXkh72";
const adminApi = `${baseUrl}/api/livejs/v1/admin/${apiPath}`;
const headers = {
    headers: {
      authorization: token
    }
  };