import { Bell } from "iconoir-react";

export default function Notifications() {
  return (
    <div className="relative">
      <Bell className="hover:fill-black fill-white transition-all duration-300 cursor-pointer" />
      <div className="w-96 bg-white rounded-2xl p-4 max-w-xl absolute right-0 z-20 shadow-2xl top-10">
        <div className="xs:mt-6 flex justify-between items-center">
          <h1 className="text-xl font-bold">
            Notificações
            <span
              id="notifications-counter"
              className="ml-2 bg-blue text-white rounded-md px-3"
            ></span>
          </h1>
          <span className="text-[0.7rem] cursor-pointer hover:text-blue hover:font-semibold transition-all duration-300">
            Marcar todas como lidas
          </span>
        </div>

        <div className=" overflow-y-scroll h-[75vh]">
          <div className="mt-3 bg-verylightgb rounded-md flex justify-between p-3">
            <img
              src="https://www.tubefilter.com/wp-content/uploads/2018/09/anna-akana-1400x825.jpg"
              alt="notification user avatar"
              className="w-12 h-12 rounded-full"
            />
            <div className="ml-2 text-sm flex-auto">
              <a href="#" className="font-bold hover:text-blue">
                Mark Webber
              </a>
              <span className="text-darkgb">reacted to your recent post</span>
              <a
                href="#"
                className="font-bold text-darkgb cursor-pointer hover:text-blue"
              >
                My first tournament today!
              </a>
              <span id="notification-ping">
                <span className="absolute inline-block rounded-full mt-2 ml-1 p-1 bg-red">
                  {" "}
                </span>
                <span className="relative inline-block animate-ping rounded-full ml-1 p-1 bg-red">
                  {" "}
                </span>
              </span>
              <p className="text-gb mt-1">1m ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
