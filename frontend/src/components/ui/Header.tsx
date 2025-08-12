import { Typography } from "./index";

const Header = () => {
  return (
    <div className="bg-blue-500 text-white p-4 text-center shadow-md">
      <Typography variant="h1" color="white" as="h1">
        Soft Robot Kinematics App
      </Typography>
    </div>
  );
};

export default Header;
