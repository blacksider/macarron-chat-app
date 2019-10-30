package com.macarron.chat.server.util;

import lombok.extern.slf4j.Slf4j;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.Base64;

@Slf4j
public class AvatarUtils {
    public static String parseToBase64Png(byte[] binary) {
        try {
            BufferedImage bi = ImageIO.read(new ByteArrayInputStream(binary));
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            OutputStream b64 = Base64.getEncoder().wrap(out);
            ImageIO.write(bi, "png", b64);
            return out.toString();
        } catch (IOException e) {
            log.error("Failed to parse avatar tp base64 encoded", e);
        }
        return null;
    }
}
