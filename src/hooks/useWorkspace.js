// ─── hooks/useWorkspace.js ───────────────────────────────────────────────────
import { useState, useCallback } from "react";
import {
  doc, setDoc, getDoc, collection, getDocs,
  deleteDoc, updateDoc, query, where
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";

export const ROLES = {
  OWNER:  "owner",
  ADMIN:  "admin",
  MEMBER: "member",
  VIEWER: "viewer",
};

export const ROLE_LABELS = {
  owner:  "Titolare",
  admin:  "Responsabile",
  member: "Collaboratore",
  viewer: "Visualizzatore",
};

export const ROLE_COLORS = {
  owner:  { bg: "#faf5ff", color: "#553c9a", border: "#d6bcfa" },
  admin:  { bg: "#ebf8ff", color: "#2b6cb0", border: "#bee3f8" },
  member: { bg: "#f0fff4", color: "#276749", border: "#9ae6b4" },
  viewer: { bg: "#f7fafc", color: "#718096", border: "#e2e8f0" },
};

export function useWorkspace({ onToast }) {
  const [workspace,  setWorkspace]  = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [members,    setMembers]    = useState([]);
  const [myRole,     setMyRole]     = useState(null);
  const [loadingWS,  setLoadingWS]  = useState(true);

  const uid       = () => auth.currentUser?.uid;
  const userEmail = () => auth.currentUser?.email;

  // ── Carica workspace utente ───────────────────────────────────────────────
  // Approccio diretto: legge workspace dove ownerId == uid (no collectionGroup)
  // + workspace dove l'utente è membro tramite documento member diretto
  const loadWorkspaces = useCallback(async () => {
    const u = uid(); if (!u) return [];
    setLoadingWS(true);
    try {
      const list = [];
      const seen = new Set();

      // 1. Workspace dove l'utente è owner
      const ownerQ = query(collection(db, "workspaces"), where("ownerId", "==", u));
      const ownerSnap = await getDocs(ownerQ);
      for (const wsDoc of ownerSnap.docs) {
        if (!seen.has(wsDoc.id)) {
          seen.add(wsDoc.id);
          list.push({ id: wsDoc.id, ...wsDoc.data(), myRole: "owner" });
        }
      }

      // 2. Workspace dove l'utente è membro (via inviti accettati)
      // Legge gli inviti accettati per trovare workspaceId aggiuntivi
      const inviteQ = query(
        collection(db, "invites"),
        where("invitedEmail", "==", userEmail()?.toLowerCase() || ""),
        where("status", "==", "accepted")
      );
      const inviteSnap = await getDocs(inviteQ);
      for (const invDoc of inviteSnap.docs) {
        const wsId = invDoc.data().workspaceId;
        if (wsId && !seen.has(wsId)) {
          seen.add(wsId);
          const wsDoc = await getDoc(doc(db, "workspaces", wsId));
          if (wsDoc.exists()) {
            // Legge il ruolo dal documento member
            const memberDoc = await getDoc(doc(db, "workspaces", wsId, "members", u));
            const role = memberDoc.exists() ? memberDoc.data().role : invDoc.data().role;
            list.push({ id: wsId, ...wsDoc.data(), myRole: role });
          }
        }
      }

      setWorkspaces(list);
      return list;
    } catch (e) {
      console.error("loadWorkspaces:", e);
      return [];
    } finally {
      setLoadingWS(false);
    }
  }, []);

  // ── Seleziona workspace attivo ────────────────────────────────────────────
  const selectWorkspace = useCallback(async (ws) => {
    const u = uid(); if (!u) return;
    setWorkspace(ws);
    setMyRole(ws.myRole);
    try {
      const snap = await getDocs(collection(db, "workspaces", ws.id, "members"));
      const list = [];
      snap.forEach(d => list.push({ uid: d.id, ...d.data() }));
      setMembers(list);
    } catch (e) {
      console.error("loadMembers:", e);
    }
  }, []);

  // ── Crea workspace ────────────────────────────────────────────────────────
  const createWorkspace = useCallback(async (name) => {
    const u = uid(); if (!u) return null;
    if (!name?.trim()) { onToast("❌ Inserisci un nome per l'azienda"); return null; }
    try {
      const ref = doc(collection(db, "workspaces"));
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14);
      const wsData = {
        name: name.trim(),
        ownerId: u,
        ownerEmail: userEmail() || "",
        createdAt: new Date().toISOString(),
        plan: "free",
        trialEndsAt: trialEnd.toISOString(),
      };
      await setDoc(ref, wsData);
      await setDoc(doc(db, "workspaces", ref.id, "members", u), {
        uid:         u,
        workspaceId: ref.id,
        role:        ROLES.OWNER,
        email:       userEmail() || "",
        displayName: auth.currentUser?.displayName || userEmail() || "Titolare",
        joinedAt:    new Date().toISOString(),
      });
      onToast("✅ Azienda creata!");
      return { id: ref.id, ...wsData, myRole: ROLES.OWNER };
    } catch (e) {
      console.error("createWorkspace:", e);
      onToast("❌ Errore nella creazione: " + e.message);
      return null;
    }
  }, [onToast]);

  // ── Invita membro ─────────────────────────────────────────────────────────
  const inviteMember = useCallback(async (email, role, workspaceId) => {
    const u = uid(); if (!u) return false;
    if (!email?.trim()) { onToast("❌ Inserisci un'email"); return false; }
    const wsId = workspaceId || workspace?.id;
    if (!wsId) return false;
    try {
      const inviteRef = doc(collection(db, "invites"));
      await setDoc(inviteRef, {
        workspaceId:    wsId,
        workspaceName:  workspace?.name || "",
        invitedEmail:   email.trim().toLowerCase(),
        role,
        invitedBy:      u,
        invitedByEmail: userEmail() || "",
        createdAt:      new Date().toISOString(),
        status:         "pending",
      });
      onToast(`✅ Invito inviato a ${email}`);
      return true;
    } catch (e) {
      console.error("inviteMember:", e);
      onToast("❌ Errore: " + e.message);
      return false;
    }
  }, [workspace, onToast]);

  // ── Inviti pendenti ───────────────────────────────────────────────────────
  const loadPendingInvites = useCallback(async () => {
    const email = userEmail()?.toLowerCase();
    if (!email) return [];
    try {
      const q = query(
        collection(db, "invites"),
        where("invitedEmail", "==", email),
        where("status", "==", "pending")
      );
      const snap = await getDocs(q);
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      return list;
    } catch (e) {
      console.error("loadPendingInvites:", e);
      return [];
    }
  }, []);

  // ── Accetta invito ────────────────────────────────────────────────────────
  const acceptInvite = useCallback(async (invite) => {
    const u = uid(); if (!u) return false;
    try {
      await setDoc(doc(db, "workspaces", invite.workspaceId, "members", u), {
        uid:         u,
        workspaceId: invite.workspaceId,
        role:        invite.role,
        email:       userEmail() || "",
        displayName: auth.currentUser?.displayName || userEmail() || "",
        joinedAt:    new Date().toISOString(),
      });
      await updateDoc(doc(db, "invites", invite.id), { status: "accepted" });
      onToast(`✅ Sei entrato in ${invite.workspaceName}`);
      return true;
    } catch (e) {
      console.error("acceptInvite:", e);
      onToast("❌ Errore: " + e.message);
      return false;
    }
  }, [onToast]);

  // ── Rifiuta invito ────────────────────────────────────────────────────────
  const rejectInvite = useCallback(async (inviteId) => {
    try {
      await updateDoc(doc(db, "invites", inviteId), { status: "rejected" });
      return true;
    } catch (e) {
      console.error("rejectInvite:", e);
      return false;
    }
  }, []);

  // ── Cambia ruolo ──────────────────────────────────────────────────────────
  const changeMemberRole = useCallback(async (memberUid, newRole) => {
    const wsId = workspace?.id; if (!wsId) return;
    try {
      await updateDoc(doc(db, "workspaces", wsId, "members", memberUid), { role: newRole });
      setMembers(m => m.map(x => x.uid === memberUid ? { ...x, role: newRole } : x));
      onToast("✅ Ruolo aggiornato");
    } catch (e) {
      onToast("❌ Errore: " + e.message);
    }
  }, [workspace, onToast]);

  // ── Rimuovi membro ────────────────────────────────────────────────────────
  const removeMember = useCallback(async (memberUid) => {
    const wsId = workspace?.id; if (!wsId) return;
    if (!window.confirm("Rimuovere questo membro dal workspace?")) return;
    try {
      await deleteDoc(doc(db, "workspaces", wsId, "members", memberUid));
      setMembers(m => m.filter(x => x.uid !== memberUid));
      onToast("✅ Membro rimosso");
    } catch (e) {
      onToast("❌ Errore: " + e.message);
    }
  }, [workspace, onToast]);

  // ── Aggiorna nome workspace ───────────────────────────────────────────────
  const updateWorkspaceName = useCallback(async (newName) => {
    const wsId = workspace?.id; if (!wsId || !newName?.trim()) return;
    try {
      await updateDoc(doc(db, "workspaces", wsId), { name: newName.trim() });
      setWorkspace(w => ({ ...w, name: newName.trim() }));
      onToast("✅ Nome aggiornato");
    } catch (e) {
      onToast("❌ Errore: " + e.message);
    }
  }, [workspace, onToast]);

  // ── Permessi ──────────────────────────────────────────────────────────────
  const can = useCallback((action) => {
    switch (action) {
      case "create_project":   return ["owner","admin","member"].includes(myRole);
      case "delete_project":   return ["owner","admin"].includes(myRole);
      case "edit_costs":       return ["owner","admin","member"].includes(myRole);
      case "see_costs":        return ["owner","admin"].includes(myRole);
      case "invite_members":   return ["owner","admin"].includes(myRole);
      case "manage_members":   return myRole === "owner";
      case "see_all_projects": return ["owner","admin"].includes(myRole);
      case "manage_workspace": return myRole === "owner";
      default: return false;
    }
  }, [myRole]);

  return {
    workspace, workspaces, members, myRole, loadingWS,
    loadWorkspaces, selectWorkspace, createWorkspace,
    inviteMember, loadPendingInvites, acceptInvite, rejectInvite,
    changeMemberRole, removeMember, updateWorkspaceName,
    can,
    setWorkspace, setMembers,
  };
}
