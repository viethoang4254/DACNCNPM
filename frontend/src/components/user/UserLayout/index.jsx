import { Outlet } from "react-router-dom";
import Sidebar from "../Sidebar";
import "./UserLayout.scss";

function UserLayout() {
  return (
    <main className="user-layout">
      <div className="user-layout__container">
        <aside className="user-layout__sidebar">
          <Sidebar />
        </aside>

        <section className="user-layout__content">
          <Outlet />
        </section>
      </div>
    </main>
  );
}

export default UserLayout;
