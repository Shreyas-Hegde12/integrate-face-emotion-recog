import cv2 
import numpy as np 
import mediapipe as mp 
from keras.models import load_model 

model  = load_model("model.keras")
label = np.load("labels.npy")


def emotion_predict(data):
	lst = data
	lst = np.array(lst).reshape(1,-1)
	print(np.shape(lst))

	pred = label[np.argmax(model.predict(lst))]
	print(pred)

	return pred