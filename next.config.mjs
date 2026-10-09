/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // Tells the browser bundle whether the dashboards run against the CRM backend (see data/today.ts).
    NEXT_PUBLIC_CRM_LIVE: process.env.CRM_API_BASE ? '1' : '',
  },
};

export default nextConfig;
