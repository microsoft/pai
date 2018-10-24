"""

Example of a deep convolutional generative adversarial network.
This example uses the layer api in tensorflow, in order to keep things simpler and easier, but powerfull.

How to use:
Put training data (images) inside 'input' folder (create one if there is none) or pass folder name with --input_dir.
Tweak the values, if necessary.
PROFIT

"""
from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import argparse
import time
import os

import numpy as np
import tensorflow as tf
import matplotlib.pyplot as plt

from PIL import Image


# Define some important stuff
img_size = 28      # 28 because MNIST is composed of 28 x 28 images
img_channel = 1    #  1 because MNIST is grayscale

noise_dim = 100

batch_size = 128
train_steps = 20000    # This number is an overshoot

image_save_step = 1000

# Kernel size
k_s = 5


# Parse args
parser = argparse.ArgumentParser()
parser.add_argument('--input', type=str, default='', help='Directory with the input data.')
parser.add_argument('--output', type=str, default='output', help='Directory where generated images will be saved.')

FLAGS, unparsed = parser.parse_known_args()
INPUT_DIR = FLAGS.input
OUTPUT_DIR = FLAGS.output

if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)


# To get images
def get_images():

    array = None

    if INPUT_DIR:
        data = []

        for file in os.listdir(INPUT_DIR):
            img = Image.open(INPUT_DIR + "/" + file)
            img = img.resize((img_size, img_size), Image.ANTIALIAS)  # Resize to target size.
            img_data = np.array(img)

            data.append(img_data)

        array = np.array(data)
    else:    # Should use MNIST
        print("No input data was given, script will use MNIST by default.")
        (x_train, x_labels), (y_train, y_labels) = tf.keras.datasets.mnist.load_data()
        array = np.expand_dims(y_train, 3)

    # Since the values of the data is in [0, 255],
    # we rescale the values of the array,
    # so that they are in [-1, 1],
    # the same as our generator output activation (tanh)
    # MNIST is already in range
    return (array - 127.5) / 127.5


# Image -> classification (real or fake)
def get_dis(x, reuse=False, train=True):

    with tf.variable_scope("dis_", reuse=reuse):

        conv1 = tf.layers.conv2d(x, 64, k_s, strides=[2, 2], padding="SAME", trainable=train)
        lrelu1 = tf.nn.leaky_relu(conv1)

        conv2 = tf.layers.conv2d(lrelu1, 128, k_s, strides=[2, 2], padding="SAME", trainable=train)
        lrelu2 = tf.nn.leaky_relu(conv2)

        flatten1 = tf.layers.flatten(lrelu2)
        drop1 = tf.nn.dropout(flatten1, 0.5)
        dense1 = tf.layers.dense(drop1, units=512, trainable=train)
        drop2 = tf.nn.dropout(dense1, 0.7)
        dense2 = tf.layers.dense(drop2, units=1, trainable=train)

        out = tf.nn.sigmoid(dense2)

        return out, dense2


# Noise -> Fake Image
def get_gen(x, reuse=False, train=True):

    with tf.variable_scope("gen_", reuse=reuse):

        # Use the fourth part of the img_size to correctly scale
        part = img_size // 4

        # Dense to amplify noise, reshape to turn it into Conv2d input
        dense1 = tf.layers.dense(x, units=part*part*32)
        reshape1 = tf.reshape(dense1, shape=[-1, part, part, 32])

        conv1 = tf.layers.conv2d_transpose(reshape1, 64, k_s, strides=[2, 2], padding="SAME", trainable=train)
        relu1 = tf.nn.relu(conv1)

        conv2 = tf.layers.conv2d_transpose(relu1, 128, k_s, strides=[2, 2], padding="SAME", trainable=train)
        relu2 = tf.nn.relu(conv2)

        conv3 = tf.layers.conv2d_transpose(relu2, img_channel, k_s, strides=[1, 1], padding="SAME", trainable=train)

        # Tanh to keep the values in [-1, 1]
        out = tf.nn.tanh(conv3)

        return out


# Define the placeholders
z_ph = tf.placeholder(tf.float32, shape=[None, noise_dim], name="noise_ph")
img_ph = tf.placeholder(tf.float32, shape=[None, img_size, img_size, img_channel], name="images_ph")

# Define the generator that will be trained
gen = get_gen(z_ph)

# Define the discriminators, one receives real image place holders and the other receives the generator,
# this way creating a combined network (noise -> generator -> fake image -> discriminator -> classification
d_real_out, d_real_logits = get_dis(img_ph)
d_fake_out, d_fake_logits = get_dis(gen, reuse=True)

# Other generator, with reuse and that will not be trained,
# will only be used to visualize images
gen_off = get_gen(z_ph, reuse=True, train=False)

# Now, we need to define the losses
with tf.name_scope("losses"):

    # The discriminator total loss will be the sum
    # of the loss of the two discriminators, using the logits
    with tf.name_scope("dis_losses"):
        # The real loss will receive a tensor made of ONES, since the images are from the dataset
        d_real_loss = tf.losses.mean_squared_error(tf.ones_like(d_real_logits), d_real_logits)

        # The fake loss will receive a tensor made of ZEROs, since the generated images are not from the dataset
        d_fake_loss = tf.losses.mean_squared_error(tf.zeros_like(d_fake_logits), d_fake_logits)

        # So, the total loss will be the sum
        d_loss = d_real_loss + d_fake_loss

    with tf.name_scope("gen_loss"):
        # The generator loss is almost the same as the ´d_fake_loss´, but receives a tensor made of
        # ONES, since we want the generator to fool the discriminator
        g_loss = tf.losses.mean_squared_error(tf.ones_like(d_fake_logits), d_fake_logits)

# Making use of the variable name scope defined in the get_gen and get_dis,
# we are able to split the trainable variables into
# the ones that belongs to the gen and the ones that belongs to the dis
train_vars = tf.trainable_variables()
gen_vars = [v for v in train_vars if v.name.startswith("gen_")]
dis_vars = [v for v in train_vars if v.name.startswith("dis_")]

# Using the var_lists, we create the Optimizers:
# One that trains the discriminator vars and minimizes the d_loss
# One that trains the generator vars and minimizes the g_loss
with tf.name_scope("Optimizers"):
    d_opt = tf.train.AdamOptimizer(learning_rate=0.0002, beta1=0.1).minimize(d_loss, var_list=dis_vars)
    g_opt = tf.train.AdamOptimizer(learning_rate=0.0004, beta1=0.3).minimize(g_loss, var_list=gen_vars)

# We then load the data
x_train = get_images()

# Op to initializer all variables
init = tf.global_variables_initializer()

# Session time!
with tf.Session() as sess:

    # Run the init
    sess.run(init)

    # Tensorboard Stuff

    # FileWriter to save the log
    writer = tf.summary.FileWriter("logs/", graph=sess.graph)

    # A summary to save generated images
    image_saver_summary = tf.summary.image("Generated Image", gen_off, max_outputs=9)

    # A summary to save info about the discriminator
    merged_dis_sum = tf.summary.merge([tf.summary.scalar("dis_loss", d_loss)])

    # A summary to save info about the generator (no need for merge here)
    merged_gen_sum = tf.summary.merge([tf.summary.scalar("gen_loss", g_loss)])

    # End of Tensorboard Stuff

    # To memorize the start time
    train_start_time = time.time()

    # Defines the main train loop
    for step in range(train_steps):

        # The noise will be from a uniform distribution [-1, 1]
        noise = np.random.uniform(-1.0, 1.0, size=[batch_size, noise_dim])

        # Random number to select the images
        random_number = np.random.randint(0, len(x_train) - batch_size)
        # Some real images
        imgs_batch = x_train[random_number: random_number + batch_size]

        # Train the discriminator (once)
        _, current_d_loss, d_sum = sess.run([d_opt, d_loss, merged_dis_sum],
                                            feed_dict={img_ph: imgs_batch, z_ph: noise})

        # Trains the generator (once)
        _, current_g_loss, g_sum = sess.run([g_opt, g_loss, merged_gen_sum],
                                            feed_dict={z_ph: noise})

        # Saves TensorBoard stuff
        writer.add_summary(d_sum, step)
        writer.add_summary(g_sum, step)

        # Print info about the step
        print("Step {0}, DLOSS {1:.15}, GLOSS {2:.15}".format(step, current_d_loss, current_g_loss))

        # Occasionally saves a image
        if step % image_save_step == 0 or step == train_steps - 1:
            print("SAVING IMAGE...")

            # Number of images to generate = r * c
            r, c = 4, 4
            # Again, noise from a uniform distribution [-1, 1]
            noise = np.random.uniform(-1.0, 1.0, size=[r*c, noise_dim])

            # Get images from the ´gen_off´
            generated_imgs, save_img_sum = sess.run([gen_off, image_saver_summary],
                                                    feed_dict={z_ph: noise})

            # Saves sample images to TensorBoard
            writer.add_summary(save_img_sum, step)

            # Rescale the images to [0, 1] (needed for matplotlib)
            generated_imgs = (generated_imgs * 0.5) + 0.5

            # Because grayscale
            generated_imgs = np.squeeze(generated_imgs)    # Comment this line if your dataset is not GRAYSCALE

            # Creates subplots
            fig, axs = plt.subplots(r, c)

            # Loop to save the images
            cnt = 0
            for i in range(r):
                for j in range(c):
                    axs[i, j].imshow(generated_imgs[cnt], cmap="gray")    # Remove the 'cmap' if your dataset is not GRAYSCALE
                    axs[i, j].axis('off')
                    cnt += 1
            
            # Set title
            fig.suptitle("Sample after {0} training steps".format(step), fontsize=14)
            # Saves
            fig.savefig("{0}/generated_{1}.png".format(OUTPUT_DIR, step))
            # Close the plt
            plt.close()

# Print
spent_time = time.time() - train_start_time
print("Trained done in {0} seconds, average of {1} steps/second".format(spent_time, train_steps / spent_time))
