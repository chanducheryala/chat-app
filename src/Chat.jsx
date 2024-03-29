import React, { useEffect } from 'react';
import './css/chatbox.css'
import './css/chatpage.css'
import toast, { Toaster } from 'react-hot-toast';
import Button from '@mui/material/Button';
import attach from './ico/attach.png'
import { useState } from 'react';
import { db, storage } from './firebase';
import { addDoc, collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { LinearProgress } from '@mui/material';
import Navbar from './Navbar'

function Chat(props) {
    const [input, setInput] = useState("")
    const [message, setMessage] = useState([])
    const [uploading, setUploading] = useState(false)
    const q = query(collection(db, "messages"), orderBy('timestamp', 'asc'));
    function inputhandler(e) {
        setInput(e.target.value)
    }
    useEffect(
        () => {
            onSnapshot(q, (snapshot) => setMessage(snapshot.docs.map((doc) => doc.data())))
        }
        , []);
    useEffect(() => {
        updateScroll()
    }, [message])
    async function sendMessage() {
        const msg = input;
        setInput("")
        await addDoc(collection(db, 'messages'), {
            name: props.name,
            text: msg,
            userimg: props.photo,
            timestamp: serverTimestamp()
        });
        updateScroll()
    }
    function updateScroll() {
        var element = document.getElementById("custom");
        element.scrollTop = element.scrollHeight;
    }
    function handlefiles(e) {
        if (e.target.files[0].type === "image/png" || e.target.files[0].type === "application/pdf" || e.target.files[0].type === "image/jpg" || e.target.files[0].type === "image/jpeg") {
            upload(e.target.files[0]);
        }
        else {
            toast.error('Unsupported file format', {
                duration: 1200,
                position: 'top-center',
            });
        }
    }
    function upload(file) {
        const storageRef = ref(storage, 'files/' + file.name);
        const uploadTask = uploadBytesResumable(storageRef, file);
        setUploading(true);
        toast('Uploading your file ...', {
            icon: '⏳',
            duration: 2000,
            position: 'top-center',
        });
        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Upload is ' + progress + '% done');
            },
            (error) => {
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    const msg = downloadURL;
                    sendfile()
                    setUploading(false)
                    async function sendfile() {
                        await addDoc(collection(db, 'messages'), {
                            name: props.name,
                            text: msg,
                            userimg: props.photo,
                            timestamp: serverTimestamp()
                        });
                    }
                    toast.success('Done uploading', {
                        duration: 1200,
                        position: 'top-center',
                    });
                });
            }
        );
    }
    return (
        <div className='chatbox'>
            <Toaster />
            <div className="chat__header">
                <Navbar name={props.name} logout={props.logout} uimg={props.photo}></Navbar>
            </div>
            <div className="uploadprogress">
                {
                    uploading ? (<LinearProgress sx={{ height: '4px' }} />) : (<></>)
                }
            </div>

            <div className="chat__body" id="custom">
                {
                    message.map(item => {
                        return (
                            <div className="messageboxcont">
                                <img style={{ width: '38px', borderRadius: '100%' }} src={item.userimg} alt="" />
                                <div className="messagebox">
                                    <h5 style={{ fontSize: '15px', fontWeight: '500' }}>{item.name}</h5>
                                    {
                                        item.text.includes('http') ? (
                                            <div className="file" style={{ border: '1.5px solid rgb(230, 230, 230)', borderRadius: '9px', padding: '2px 12px', marginTop: '5px', backgroundColor: 'rgb(255,255,255)', paddingBottom: '9px', width: '80%', overflowX: 'scroll' }}>
                                                <div className="headerfileformat" style={{ marginTop: '9px' }}>
                                                    <h5>File Shared : </h5>
                                                </div>
                                                <a href={item.text} target="_blank" className="chat__body__message" rel="noreferrer">
                                                    {item.text}
                                                </a>
                                            </div>
                                        ) : (
                                            <p className="chat__body__message">
                                                {item.text}
                                            </p>
                                        )
                                    }

                                </div>
                            </div>
                        )
                    })
                }
            </div>

            <div className="chat__footer">
                <input value={input} type="text" placeholder='Type a message...' onChange={inputhandler} />
                <input type="file" name="" onChange={(e) => handlefiles(e)} id="filein" hidden />
                <label htmlFor='filein' style={{ border: 'none', outline: 'none', cursor: 'pointer' }}><img style={{ width: '25px' }} src={attach} alt="" /></label>

                {
                    input ? (<Button onClick={() => { sendMessage() }} variant="outlined" style={{ height: '35px',marginRight:'9px' }} size="small">
                        <p style={{ fontWeight: 'bold' }}>send</p>
                    </Button>) : (<Button disabled variant="outlined" style={{ height: '35px',marginRight:'9px' }} size="small">
                        <p style={{ fontWeight: 'bold' }}>send</p>
                    </Button>)
                }


            </div>
        </div >
    );
}

export default Chat;
