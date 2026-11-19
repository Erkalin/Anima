"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import {
  deleteAuthorAction,
  deleteCategoryAction,
  deleteTagAction,
  saveAuthorAction,
  saveCategoryAction,
  saveTagAction,
} from "@/lib/actions/taxonomy";
import {
  ACCENTS,
  type AccentKey,
  type Author,
  type Category,
  type Media,
  type Post,
  type Tag,
} from "@/lib/types";
import { slugify, toFa } from "@/lib/utils";
import { Icon } from "@/app/components/admin/Icons";
import { MediaPicker } from "@/app/components/admin/MediaPicker";
import { Empty, Modal, useToast } from "@/app/components/admin/ui";

const emptyCategory = (): Category => ({
  id: "",
  name: "",
  slug: "",
  accent: "brass",
  description: "",
});

const emptyAuthor = (): Author => ({
  id: "",
  name: "",
  role: "",
  bio: "",
  avatarUrl: null,
});

export function TaxonomyManager({
  categories,
  tags,
  authors,
  posts,
  media,
  defaultAuthorId,
}: {
  categories: Category[];
  tags: Tag[];
  authors: Author[];
  posts: Post[];
  media: Media[];
  defaultAuthorId: string | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [cats, setCats] = useState(categories);
  const [labels, setLabels] = useState(tags);
  const [people, setPeople] = useState(authors);
  const [library, setLibrary] = useState(media);

  const [catDraft, setCatDraft] = useState<Category | null>(null);
  const [authorDraft, setAuthorDraft] = useState<Author | null>(null);
  const [avatarFor, setAvatarFor] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<{
    kind: "category" | "tag" | "author";
    id: string;
    name: string;
    used: number;
  } | null>(null);

  useEffect(() => setCats(categories), [categories]);
  useEffect(() => setLabels(tags), [tags]);
  useEffect(() => setPeople(authors), [authors]);
  useEffect(() => setLibrary(media), [media]);

  const catUse = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of posts)
      if (p.categoryId) map.set(p.categoryId, (map.get(p.categoryId) ?? 0) + 1);
    return map;
  }, [posts]);

  const tagUse = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of posts)
      for (const t of p.tags) map.set(t, (map.get(t) ?? 0) + 1);
    return map;
  }, [posts]);

  const authorUse = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of posts)
      if (p.authorId) map.set(p.authorId, (map.get(p.authorId) ?? 0) + 1);
    return map;
  }, [posts]);

  async function putCategory() {
    if (!catDraft) return;
    setBusy(true);
    const res = await saveCategoryAction(catDraft);
    setBusy(false);
    if (!res.ok) return toast.err(res.error);
    setCats((list) => {
      const at = list.findIndex((c) => c.id === res.data.id);
      return at === -1
        ? [...list, res.data]
        : list.map((c) => (c.id === res.data.id ? res.data : c));
    });
    setCatDraft(null);
    toast.ok("دسته ذخیره شد.");
    router.refresh();
  }

  async function putAuthor() {
    if (!authorDraft) return;
    setBusy(true);
    const res = await saveAuthorAction(authorDraft);
    setBusy(false);
    if (!res.ok) return toast.err(res.error);
    setPeople((list) => {
      const at = list.findIndex((a) => a.id === res.data.id);
      return at === -1
        ? [...list, res.data]
        : list.map((a) => (a.id === res.data.id ? res.data : a));
    });
    setAuthorDraft(null);
    toast.ok("نویسنده ذخیره شد.");
    router.refresh();
  }

  async function addTag() {
    const name = newTag.trim();
    if (!name) return;
    if (labels.some((t) => t.name === name)) {
      toast.err("این برچسب از قبل هست.");
      return;
    }
    setBusy(true);
    const res = await saveTagAction({ id: "", name, slug: "" });
    setBusy(false);
    if (!res.ok) return toast.err(res.error);
    setLabels((list) => [...list, res.data]);
    setNewTag("");
    toast.ok(`برچسب «${name}» ساخته شد.`);
    router.refresh();
  }

  async function doDelete() {
    if (!confirm) return;
    const { kind, id, name } = confirm;
    setConfirm(null);
    setBusy(true);
    const res =
      kind === "category"
        ? await deleteCategoryAction(id)
        : kind === "tag"
          ? await deleteTagAction(id)
          : await deleteAuthorAction(id);
    setBusy(false);
    if (!res.ok) return toast.err(res.error);
    if (kind === "category") setCats((l) => l.filter((c) => c.id !== id));
    if (kind === "tag") setLabels((l) => l.filter((t) => t.id !== id));
    if (kind === "author") setPeople((l) => l.filter((a) => a.id !== id));
    toast.info(`«${name}» حذف شد.`);
    router.refresh();
  }

  return (
    <div className="admin-body">
      <section className="panel">
        <div className="panel-head">
          <h2 className="panel-title">دسته‌ها</h2>
          <p className="panel-note">
            هر نوشته در یک دسته می‌نشیند؛ رنگِ دسته در وبلاگ دیده می‌شود.
          </p>
          <div className="admin-top-spacer" />
          <button
            className="btn btn-brass btn-sm"
            type="button"
            onClick={() => setCatDraft(emptyCategory())}
          >
            <Icon name="plus" /> دستهٔ تازه
          </button>
        </div>
        <div className="panel-body">
          {cats.length ? (
            <ul className="list-plain">
              {cats.map((c) => (
                <li key={c.id}>
                  <span
                    className="accent-dot is-on"
                    style={{ "--swatch": ACCENTS.find((a) => a.key === c.accent)?.hex } as CSSProperties}
                    aria-hidden="true"
                  />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span className="tbl-name">{c.name}</span>
                    <span className="tbl-slug">/blog?category={c.slug}</span>
                    {c.description ? (
                      <span className="muted" style={{ display: "block" }}>
                        {c.description}
                      </span>
                    ) : null}
                  </span>
                  <span className="pill" data-tone="published">
                    {toFa(catUse.get(c.id) ?? 0)} نوشته
                  </span>
                  <span className="tbl-actions">
                    <button
                      className="icon-btn"
                      type="button"
                      onClick={() => setCatDraft(c)}
                      aria-label={`ویرایش ${c.name}`}
                    >
                      <Icon name="edit" />
                    </button>
                    <button
                      className="icon-btn"
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        setConfirm({
                          kind: "category",
                          id: c.id,
                          name: c.name,
                          used: catUse.get(c.id) ?? 0,
                        })
                      }
                      aria-label={`حذف ${c.name}`}
                    >
                      <Icon name="trash" />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty
              icon="folder"
              title="دسته‌ای ساخته نشده"
              note="دسته‌ها به خواننده کمک می‌کنند مسیرش را پیدا کند."
            />
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2 className="panel-title">برچسب‌ها</h2>
          <p className="panel-note">
            برچسب‌ها آزادند؛ هنگام نوشتن هم می‌توانید بسازید.
          </p>
          <div className="admin-top-spacer" />
          <div style={{ display: "flex", gap: "0.4rem" }}>
            <input
              className="input"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void addTag();
                }
              }}
              placeholder="نامِ برچسب"
              aria-label="نام برچسب تازه"
              style={{ width: "12rem" }}
            />
            <button
              className="btn btn-ghost btn-sm"
              type="button"
              disabled={busy || !newTag.trim()}
              onClick={addTag}
            >
              <Icon name="plus" /> افزودن
            </button>
          </div>
        </div>
        <div className="panel-body">
          {labels.length ? (
            <div className="chip-row">
              {labels.map((t) => (
                <span className="chip" key={t.id}>
                  {t.name}
                  <span className="muted" style={{ fontSize: "0.7rem" }}>
                    {toFa(tagUse.get(t.name) ?? 0)}
                  </span>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      setConfirm({
                        kind: "tag",
                        id: t.id,
                        name: t.name,
                        used: tagUse.get(t.name) ?? 0,
                      })
                    }
                    aria-label={`حذف ${t.name}`}
                  >
                    <Icon name="x" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <Empty icon="tag" title="برچسبی نیست" />
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2 className="panel-title">نویسنده‌ها</h2>
          <p className="panel-note">
            نام و عکس‌شان پایینِ نوشته می‌آید.
          </p>
          <div className="admin-top-spacer" />
          <button
            className="btn btn-brass btn-sm"
            type="button"
            onClick={() => setAuthorDraft(emptyAuthor())}
          >
            <Icon name="plus" /> نویسندهٔ تازه
          </button>
        </div>
        <div className="panel-body">
          {people.length ? (
            <div className="people-grid">
              {people.map((a) => (
                <article className="person" key={a.id}>
                  <span className="person-avatar">
                    {a.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.avatarUrl} alt="" />
                    ) : (
                      a.name.trim().slice(0, 1) || "؟"
                    )}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="person-name">
                      {a.name}
                      {a.id === defaultAuthorId ? (
                        <span className="pill" data-tone="published">
                          پیش‌فرض
                        </span>
                      ) : null}
                    </p>
                    <p className="muted">{a.role || "—"}</p>
                    {a.bio ? <p className="person-bio">{a.bio}</p> : null}
                    <p className="muted" style={{ marginTop: "0.35rem" }}>
                      {toFa(authorUse.get(a.id) ?? 0)} نوشته
                    </p>
                  </div>
                  <span className="tbl-actions" style={{ flexDirection: "column" }}>
                    <button
                      className="icon-btn"
                      type="button"
                      onClick={() => setAuthorDraft(a)}
                      aria-label={`ویرایش ${a.name}`}
                    >
                      <Icon name="edit" />
                    </button>
                    <button
                      className="icon-btn"
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        setConfirm({
                          kind: "author",
                          id: a.id,
                          name: a.name,
                          used: authorUse.get(a.id) ?? 0,
                        })
                      }
                      aria-label={`حذف ${a.name}`}
                    >
                      <Icon name="trash" />
                    </button>
                  </span>
                </article>
              ))}
            </div>
          ) : (
            <Empty icon="user" title="نویسنده‌ای ثبت نشده" />
          )}
        </div>
      </section>

      {catDraft ? (
        <Modal
          title={catDraft.id ? "ویرایشِ دسته" : "دستهٔ تازه"}
          onClose={() => setCatDraft(null)}
          size="narrow"
          foot={
            <>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => setCatDraft(null)}
              >
                انصراف
              </button>
              <button
                className="btn btn-brass"
                type="button"
                aria-disabled={busy || !catDraft.name.trim()}
                onClick={putCategory}
              >
                <Icon name="save" /> ذخیره
              </button>
            </>
          }
        >
          <div className="stack">
            <div className="field">
              <label className="label" htmlFor="c-name">
                نامِ دسته
              </label>
              <input
                id="c-name"
                className="input"
                value={catDraft.name}
                onChange={(e) =>
                  setCatDraft({ ...catDraft, name: e.target.value })
                }
                placeholder="مثلاً تمرین"
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="c-slug">
                نشانی
                <span className="label-hint">
                  خالی بگذارید تا از نام ساخته شود
                </span>
              </label>
              <input
                id="c-slug"
                className="input mono"
                dir="ltr"
                value={catDraft.slug}
                onChange={(e) =>
                  setCatDraft({ ...catDraft, slug: e.target.value })
                }
                placeholder={slugify(catDraft.name) || "tamrin"}
              />
            </div>
            <div className="field">
              <span className="label">رنگ</span>
              <div className="accent-row">
                {ACCENTS.map((a) => (
                  <button
                    key={a.key}
                    type="button"
                    className={`accent-dot${catDraft.accent === a.key ? " is-on" : ""}`}
                    style={{ "--swatch": a.hex } as CSSProperties}
                    onClick={() =>
                      setCatDraft({ ...catDraft, accent: a.key as AccentKey })
                    }
                    aria-label={a.label}
                    aria-pressed={catDraft.accent === a.key}
                    title={a.label}
                  />
                ))}
              </div>
            </div>
            <div className="field">
              <label className="label" htmlFor="c-desc">
                توضیح
              </label>
              <textarea
                id="c-desc"
                className="textarea"
                rows={3}
                maxLength={240}
                value={catDraft.description}
                onChange={(e) =>
                  setCatDraft({ ...catDraft, description: e.target.value })
                }
                placeholder="یک خط دربارهٔ این دسته"
              />
            </div>
          </div>
        </Modal>
      ) : null}

      {authorDraft ? (
        <Modal
          title={authorDraft.id ? "ویرایشِ نویسنده" : "نویسندهٔ تازه"}
          onClose={() => setAuthorDraft(null)}
          size="narrow"
          foot={
            <>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => setAuthorDraft(null)}
              >
                انصراف
              </button>
              <button
                className="btn btn-brass"
                type="button"
                aria-disabled={busy || !authorDraft.name.trim()}
                onClick={putAuthor}
              >
                <Icon name="save" /> ذخیره
              </button>
            </>
          }
        >
          <div className="stack">
            <button
              className="cover-slot"
              type="button"
              onClick={() => setAvatarFor(true)}
              style={{ aspectRatio: "1 / 1", width: "7rem" }}
            >
              {authorDraft.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={authorDraft.avatarUrl} alt="" />
              ) : (
                <span>
                  <Icon name="image" /> عکس
                </span>
              )}
            </button>
            <div className="field">
              <label className="label" htmlFor="a-name">
                نام
              </label>
              <input
                id="a-name"
                className="input"
                value={authorDraft.name}
                onChange={(e) =>
                  setAuthorDraft({ ...authorDraft, name: e.target.value })
                }
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="a-role">
                نقش
              </label>
              <input
                id="a-role"
                className="input"
                value={authorDraft.role}
                onChange={(e) =>
                  setAuthorDraft({ ...authorDraft, role: e.target.value })
                }
                placeholder="مدرسِ پیانو"
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="a-bio">
                معرفیِ کوتاه
              </label>
              <textarea
                id="a-bio"
                className="textarea"
                rows={4}
                maxLength={400}
                value={authorDraft.bio}
                onChange={(e) =>
                  setAuthorDraft({ ...authorDraft, bio: e.target.value })
                }
              />
            </div>
          </div>
        </Modal>
      ) : null}

      {avatarFor && authorDraft ? (
        <MediaPicker
          kind="image"
          media={library}
          title="عکسِ نویسنده"
          onClose={() => setAvatarFor(false)}
          onUploaded={(rows) => setLibrary((l) => [...rows, ...l])}
          onSubmit={(items) => {
            setAuthorDraft({ ...authorDraft, avatarUrl: items[0].url });
            setAvatarFor(false);
          }}
        />
      ) : null}

      {confirm ? (
        <Modal
          title="حذف"
          onClose={() => setConfirm(null)}
          size="narrow"
          foot={
            <>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => setConfirm(null)}
              >
                نگه دار
              </button>
              <button
                className="btn btn-danger"
                type="button"
                onClick={doDelete}
              >
                <Icon name="trash" /> حذف کن
              </button>
            </>
          }
        >
          <p>
            <strong>{confirm.name}</strong> حذف شود؟
          </p>
          {confirm.used ? (
            <p className="muted" style={{ marginTop: "0.5rem" }}>
              {toFa(confirm.used)} نوشته هنوز به آن اشاره دارد؛ آن نوشته‌ها
              پاک نمی‌شوند، فقط این نام از فهرست‌ها می‌رود.
            </p>
          ) : null}
        </Modal>
      ) : null}
    </div>
  );
}