import type { Teacher } from "../data";
import { PianoKeys, ViolinArt } from "./Art";

export function TeacherCard({ teacher }: { teacher: Teacher }) {
  return (
    <article
      className={teacher.featured ? "teacher teacher-featured" : "teacher"}
      data-reveal
    >
      <div className="portrait" aria-hidden="true">
        <div className="portrait-art">
          {teacher.instrument === "piano" ? <PianoKeys /> : <ViolinArt />}
        </div>
        <span className="portrait-label">{teacher.role}</span>
      </div>
      <h3 className="teacher-name">{teacher.name}</h3>
      <p className="teacher-role">{teacher.role}</p>
      <p className="teacher-bio">{teacher.bio}</p>
    </article>
  );
}
