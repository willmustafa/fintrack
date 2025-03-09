import { Bell } from "iconoir-react";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

export default function Notifications() {
  const [notifications, setNotifications] = useState([
    1, 2, 3, 4, 5, 6, 7, 8, 9,
  ]);
  const [showNotification, setShowNotification] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(event: { target: any }) {
      if (ref.current && !(ref.current as any)?.contains(event.target)) {
        setShowNotification(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref]);

  return (
    <div className={clsx("relative group", showNotification && "active")}>
      <div
        className="relative group cursor-pointer"
        onClick={() => setShowNotification(!showNotification)}
      >
        <Bell className="fill-none transition-all duration-300 cursor-pointer group-hover:fill-[var(--dark-blue)] stroke-[var(--dark-blue)]" />
        <span className="absolute -top-2 right-4 before:animate-[ping_3s_ease_infinite] before:bg-red-200 before:w-6 before:h-6 before:rounded-full before:absolute before:content-['']"></span>
        <span className="absolute -top-1 -right-1 rounded-full bg-red-400 text-[0.7rem] flex justify-center items-center w-4 h-4 font-semibold">
          {notifications.length}
        </span>
      </div>
      <div
        className={clsx(
          "w-96 h-[90vh] bg-white rounded-2xl max-w-xl absolute right-0 z-20 shadow-2xl top-10 group-[.active]:border-1 border-gray-300 transition-[max-height] duration-700 max-h-0 group-[.active]:max-h-[2000px] overflow-hidden border-0 ",
        )}
        ref={ref}
      >
        <div className="p-4 h-full">
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

          <div className="overflow-y-scroll h-[95%]">
            {notifications.map((notification) => (
              <NotificationCard key={notification} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationCard() {
  return (
    <div className="mt-3 rounded-md flex justify-between p-3 hover:bg-gray-200 transition-all duration-200 cursor-pointer">
      <img
        src="https://www.tubefilter.com/wp-content/uploads/2018/09/anna-akana-1400x825.jpg"
        alt="notification user avatar"
        className="w-12 h-12 rounded-full"
      />
      <div className="ml-2 text-sm flex-auto">
        <a href="#" className="font-bold hover:text-blue">
          Mark Webber
        </a>{" "}
        <span className="text-darkgb">reacted to your recent post</span>{" "}
        <a
          href="#"
          className="font-bold text-darkgb cursor-pointer hover:text-blue"
        >
          My first tournament today!
        </a>{" "}
        <span className="inline-flex relative justify-center items-center w-5">
          <span className="absolute inline-block rounded-full p-1 bg-red-500">
            {" "}
          </span>
          <span className="relative inline-block animate-ping rounded-full p-1 bg-red-500">
            {" "}
          </span>
        </span>
        <p className="text-gray-600 text-[0.7rem] mt-1">1m ago</p>
      </div>
    </div>
  );
}
