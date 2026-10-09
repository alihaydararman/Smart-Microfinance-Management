import { useState, useEffect } from "react";
import axios from "axios";

function MemberList() {
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [memberList, setMemberList] = useState([]);

  const [editingMember, setEditingMember] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");

  const [deleteMember, setDeleteMember] = useState(null);

  // Get Members
  useEffect(() => {
    axios
      .get("/api/members")
      .then((response) => {
        setMemberList(response.data);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  // Add Member
  const handleAddMember = () => {
    const newMember = {
      memberId: `M${Date.now()}`,
      name: name,
      phone: phone,
      address: address,
      savings: 0,
      status: "Active",
    };

    axios
      .post("/api/members", newMember)
      .then((response) => {
        setMemberList([...memberList, response.data]);

        setName("");
        setPhone("");
        setAddress("");
        setShowForm(false);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  // Delete Member
  const handleDeleteMember = () => {
    axios
      .delete(`/api/members/${deleteMember._id}`)
      .then(() => {
        setMemberList(
          memberList.filter(
            (member) => member._id !== deleteMember._id
          )
        );

        setDeleteMember(null);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  return (
    <section className="member-section">

      {/* Header */}
      <div className="section-header">
        <h2>Members</h2>

        <button onClick={() => setShowForm(!showForm)}>
          Add Member
        </button>
      </div>

      {/* Add Member Form */}
      {showForm && (
        <div className="member-form">
          <h3>Add New Member</h3>

          <input
            type="text"
            placeholder="Member Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            type="text"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <input
            type="text"
            placeholder="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <button onClick={handleAddMember}>
            Add Member
          </button>
        </div>
      )}

      {/* Edit Member Form */}
      {editingMember && (
        <div className="member-form">
          <h3>Edit Member</h3>

          <input
            type="text"
            placeholder="Member Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />

          <input
            type="text"
            placeholder="Phone Number"
            value={editPhone}
            onChange={(e) => setEditPhone(e.target.value)}
          />

          <input
            type="text"
            placeholder="Address"
            value={editAddress}
            onChange={(e) => setEditAddress(e.target.value)}
          />

          <button
            onClick={() => {
              axios
                .put(`/api/members/${editingMember._id}`, {
                  name: editName,
                  phone: editPhone,
                  address: editAddress,
                })
                .then((response) => {
                  setMemberList(
                    memberList.map((member) =>
                      member._id === response.data._id
                        ? response.data
                        : member
                    )
                  );

                  setEditingMember(null);
                })
                .catch((error) => {
                  console.log(error);
                });
            }}
          >
            Save Changes
          </button>

          <button
            onClick={() => {
              setEditingMember(null);
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Members Table */}
      <table className="member-table">
        <thead>
          <tr>
            <th>Member ID</th>
            <th>Name</th>
            <th>Phone</th>
            <th>Savings</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {memberList.map((member) => (
            <tr key={member._id}>
              <td>{member.memberId}</td>
              <td>{member.name}</td>
              <td>{member.phone}</td>
              <td>৳{member.savings}</td>
              <td>
                <span className="status-badge">
                  {member.status}
                </span>
              </td>

              <td>
                {/* Edit Button */}
                <button
                  onClick={() => {
                    setEditingMember(member);
                    setEditName(member.name);
                    setEditPhone(member.phone);
                    setEditAddress(member.address);
                  }}
                >
                  Edit
                </button>

                {/* Delete Button */}
                <button
                  className="delete-btn"
                  onClick={() => setDeleteMember(member)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Delete Confirmation Modal */}
      {deleteMember && (
        <div className="delete-modal-overlay">

          <div className="delete-modal">

            <div className="delete-icon">
              🗑️
            </div>

            <h3>Delete Member?</h3>

            <p>
              Are you sure you want to delete{" "}
              <strong>{deleteMember.name}</strong>?
            </p>

            <div className="delete-modal-actions">

              <button
                className="cancel-btn"
                onClick={() => setDeleteMember(null)}
              >
                Cancel
              </button>

              <button
                className="confirm-delete-btn"
                onClick={handleDeleteMember}
              >
                Delete
              </button>

            </div>

          </div>

        </div>
      )}

    </section>
  );
}

export default MemberList;